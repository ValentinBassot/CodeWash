import { describe, expect, it, vi } from 'vitest';
import { createCollector } from './collector';
import { createFpsSampler, installErrorSensor, installLongTaskSensor } from './sensors';

const fakeTarget = () => {
    const listeners = {};
    return {
        listeners,
        addEventListener: (type, listener) => (listeners[type] = listener),
        removeEventListener: (type, listener) => {
            if (listeners[type] === listener) delete listeners[type];
        },
    };
};

describe('installErrorSensor', () => {
    it('records the errors of the window', () => {
        const target = fakeTarget();
        const collector = createCollector();
        installErrorSensor({ target, collector });
        target.listeners.error({ message: 'boom', error: new TypeError('boom') });
        expect(collector.getEvents()).toMatchObject([
            { type: 'error', origin: 'window', errorType: 'TypeError', message: 'boom' },
        ]);
    });

    it('records an error without an error object', () => {
        const target = fakeTarget();
        const collector = createCollector();
        installErrorSensor({ target, collector });
        target.listeners.error({ message: 'Script error.' });
        target.listeners.error({ error: new RangeError('range') });
        expect(collector.getEvents()).toMatchObject([
            { errorType: 'Error', message: 'Script error.' },
            { errorType: 'RangeError', message: 'range' },
        ]);
    });

    it('records the rejected promises that nobody handled', () => {
        const target = fakeTarget();
        const collector = createCollector();
        installErrorSensor({ target, collector });
        target.listeners.unhandledrejection({ reason: new SyntaxError('late') });
        target.listeners.unhandledrejection({ reason: 'plain text' });
        expect(collector.getEvents()).toMatchObject([
            { origin: 'promise', errorType: 'SyntaxError', message: 'late' },
            { origin: 'promise', errorType: 'UnhandledRejection', message: 'plain text' },
        ]);
    });

    it('survives an event that cannot be read', () => {
        const target = fakeTarget();
        const collector = createCollector();
        installErrorSensor({ target, collector });
        const hostile = {
            get error() {
                throw new Error('no');
            },
        };
        expect(() => target.listeners.error(hostile)).not.toThrow();
        expect(() =>
            target.listeners.unhandledrejection({
                get reason() {
                    throw new Error('no');
                },
            }),
        ).not.toThrow();
        expect(collector.getEvents()).toEqual([]);
    });

    it('records a message without the text it quotes', () => {
        const target = fakeTarget();
        const collector = createCollector();
        installErrorSensor({ target, collector });
        target.listeners.error({ message: `Unexpected token 'z', ..."name":"Alice"}" is not valid JSON` });
        expect(JSON.stringify(collector.getEvents())).not.toContain('Alice');
    });

    it('leaves nothing installed when a listener cannot be added', () => {
        const added = [];
        const target = {
            addEventListener: (type, handler) => {
                if (type === 'unhandledrejection') throw new Error('refused');
                added.push(type, handler);
            },
            removeEventListener: vi.fn(),
        };
        const uninstall = installErrorSensor({ target, collector: createCollector() });
        expect(target.removeEventListener).toHaveBeenCalledWith('error', added[1]);
        expect(() => uninstall()).not.toThrow();
        expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('uninstalls without throwing when the window refuses to remove a listener', () => {
        const target = {
            addEventListener: () => {},
            removeEventListener: vi.fn(() => {
                throw new Error('refused');
            }),
        };
        const uninstall = installErrorSensor({ target, collector: createCollector() });
        expect(() => uninstall()).not.toThrow();
        expect(target.removeEventListener).toHaveBeenCalledTimes(2);
        expect(() => uninstall()).not.toThrow();
        expect(target.removeEventListener).toHaveBeenCalledTimes(2);
    });

    it('stops listening once uninstalled', () => {
        const target = fakeTarget();
        const uninstall = installErrorSensor({ target, collector: createCollector() });
        expect(Object.keys(target.listeners).sort()).toEqual(['error', 'unhandledrejection']);
        uninstall();
        expect(target.listeners).toEqual({});
    });
});

class FakeObserver {
    static supportedEntryTypes = ['longtask', 'paint'];
    static instances = [];
    static failOnObserve = false;
    constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        FakeObserver.instances.push(this);
    }
    observe(options) {
        if (FakeObserver.failOnObserve) throw new Error('unsupported');
        this.options = options;
    }
    disconnect() {
        this.disconnected = true;
    }
}

describe('installLongTaskSensor', () => {
    it('records each long task as a latency', () => {
        FakeObserver.instances = [];
        FakeObserver.failOnObserve = false;
        const time = { value: 0 };
        const collector = createCollector({ clock: () => time.value });
        installLongTaskSensor({ observerClass: FakeObserver, collector });
        const [observer] = FakeObserver.instances;
        expect(observer.options).toEqual({ entryTypes: ['longtask'] });
        observer.callback({ getEntries: () => [{ duration: 120 }] });
        time.value = 1500;
        observer.callback({ getEntries: () => [{ duration: 80 }] });
        expect(collector.getEvents()).toMatchObject([
            { type: 'latency', name: 'longtask', durationMs: 120, ok: true },
            { type: 'latency', name: 'longtask', durationMs: 80 },
        ]);
    });

    it('records at most one long task per second', () => {
        FakeObserver.instances = [];
        FakeObserver.failOnObserve = false;
        const time = { value: 0 };
        const collector = createCollector({ clock: () => time.value });
        installLongTaskSensor({ observerClass: FakeObserver, collector });
        const [observer] = FakeObserver.instances;
        const entries = { getEntries: () => [{ duration: 60 }, { duration: 70 }] };
        observer.callback(entries);
        time.value = 999;
        observer.callback(entries);
        expect(collector.getEvents()).toHaveLength(1);
        time.value = 1000;
        observer.callback(entries);
        expect(collector.getEvents()).toHaveLength(2);
    });

    it('survives a list of entries that cannot be read', () => {
        FakeObserver.instances = [];
        installLongTaskSensor({ observerClass: FakeObserver, collector: createCollector() });
        expect(() =>
            FakeObserver.instances[0].callback({
                getEntries: () => {
                    throw new Error('no');
                },
            }),
        ).not.toThrow();
    });

    it('disconnects when uninstalled', () => {
        FakeObserver.instances = [];
        const uninstall = installLongTaskSensor({ observerClass: FakeObserver, collector: createCollector() });
        uninstall();
        expect(FakeObserver.instances[0].disconnected).toBe(true);
    });

    it('does nothing where the browser has no observer, or no long task support', () => {
        const collector = createCollector();
        expect(installLongTaskSensor({ observerClass: undefined, collector })).toBeTypeOf('function');
        class NoLongTask {
            static supportedEntryTypes = ['paint'];
        }
        class NoList {}
        expect(installLongTaskSensor({ observerClass: NoLongTask, collector })).toBeTypeOf('function');
        expect(installLongTaskSensor({ observerClass: NoList, collector })).toBeTypeOf('function');
    });

    it('does nothing when the browser refuses to observe', () => {
        FakeObserver.instances = [];
        FakeObserver.failOnObserve = true;
        const uninstall = installLongTaskSensor({ observerClass: FakeObserver, collector: createCollector() });
        expect(() => uninstall()).not.toThrow();
        FakeObserver.failOnObserve = false;
    });
});

const fakeFrames = () => {
    const state = { callback: null, handle: 0, cancelled: [] };
    return {
        state,
        raf: (callback) => {
            state.callback = callback;
            return ++state.handle;
        },
        caf: (handle) => state.cancelled.push(handle),
        frame: (timestamp) => state.callback(timestamp),
    };
};

describe('createFpsSampler', () => {
    it('measures the frames of each second and records the average and the minimum when it stops', () => {
        const frames = fakeFrames();
        const collector = createCollector();
        const sampler = createFpsSampler({ collector, raf: frames.raf, caf: frames.caf });
        sampler.start();
        expect(sampler.isRunning()).toBe(true);
        for (let t = 0; t <= 1000; t += 25) frames.frame(t);
        for (let t = 1050; t <= 2000; t += 50) frames.frame(t);
        sampler.stop();
        expect(sampler.isRunning()).toBe(false);
        expect(frames.state.cancelled).toEqual([frames.state.handle]);
        expect(collector.getEvents()).toMatchObject([{ type: 'fps', average: 30, min: 20, samples: 2 }]);
    });

    it('records nothing when it stops before a full second', () => {
        const frames = fakeFrames();
        const collector = createCollector();
        const sampler = createFpsSampler({ collector, raf: frames.raf, caf: frames.caf });
        sampler.start();
        frames.frame(0);
        frames.frame(300);
        sampler.stop();
        expect(collector.getEvents()).toEqual([]);
    });

    it('drops a window that lasted too long, as when the tab was hidden', () => {
        const frames = fakeFrames();
        const collector = createCollector();
        const sampler = createFpsSampler({ collector, raf: frames.raf, caf: frames.caf });
        sampler.start();
        frames.frame(0);
        frames.frame(60000);
        sampler.stop();
        expect(collector.getEvents()).toEqual([]);
    });

    it('records every ten seconds without waiting for the end', () => {
        const frames = fakeFrames();
        const collector = createCollector();
        const sampler = createFpsSampler({ collector, raf: frames.raf, caf: frames.caf, flushEvery: 2 });
        sampler.start();
        for (let t = 0; t <= 2000; t += 1000) frames.frame(t);
        expect(collector.getEvents()).toHaveLength(1);
        sampler.stop();
        expect(collector.getEvents()).toHaveLength(1);
    });

    it('does not start without a way to cancel the frames', () => {
        const frames = fakeFrames();
        const raf = vi.fn(frames.raf);
        const sampler = createFpsSampler({ collector: createCollector(), raf, caf: undefined });
        sampler.start();
        expect(sampler.isRunning()).toBe(false);
        expect(raf).not.toHaveBeenCalled();
    });

    it('start twice runs once, stop without start does nothing, and a missing raf never starts', () => {
        const frames = fakeFrames();
        const raf = vi.fn(frames.raf);
        const sampler = createFpsSampler({ collector: createCollector(), raf, caf: frames.caf });
        sampler.stop();
        sampler.start();
        sampler.start();
        expect(raf).toHaveBeenCalledTimes(1);

        const mute = createFpsSampler({ collector: createCollector(), raf: undefined, caf: undefined });
        mute.start();
        expect(mute.isRunning()).toBe(false);
    });
});
