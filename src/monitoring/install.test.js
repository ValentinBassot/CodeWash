import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCollector } from './collector';
import { installMonitoring, uninstallMonitoring } from './install';
import * as monitoring from './index';

class FakeObserver {
    static supportedEntryTypes = ['longtask'];
    static instances = [];
    constructor(callback) {
        this.callback = callback;
        FakeObserver.instances.push(this);
    }
    observe() {}
    disconnect() {
        this.disconnected = true;
    }
}

const setup = () => {
    const listeners = {};
    const frames = { callback: null, handle: 0, cancelled: [] };
    const options = {
        collector: createCollector(),
        target: {
            addEventListener: (type, listener) => (listeners[type] = listener),
            removeEventListener: (type) => delete listeners[type],
        },
        observerClass: FakeObserver,
        raf: (callback) => {
            frames.callback = callback;
            return ++frames.handle;
        },
        caf: (handle) => frames.cancelled.push(handle),
    };
    return { options, listeners, frames };
};

beforeEach(() => {
    FakeObserver.instances = [];
});

afterEach(uninstallMonitoring);

describe('installMonitoring', () => {
    it('records the start of the app and listens to errors and long tasks', () => {
        const { options, listeners } = setup();
        installMonitoring(options);
        expect(options.collector.getEvents()).toMatchObject([{ type: 'flow', name: 'app-start' }]);
        listeners.error({ message: 'boom', error: new TypeError('boom') });
        FakeObserver.instances[0].callback({ getEntries: () => [{ duration: 90 }] });
        expect(options.collector.getEvents().map((event) => event.type)).toEqual(['flow', 'error', 'latency']);
    });

    it('measures the frames only between the start and the end of a battle', () => {
        const { options, frames } = setup();
        installMonitoring(options);
        expect(frames.callback).toBeNull();
        options.collector.record('flow', { name: 'drawer-open' });
        expect(frames.callback).toBeNull();
        options.collector.record('flow', { name: 'battle-start' });
        expect(frames.callback).toBeTypeOf('function');
        frames.callback(0);
        frames.callback(1000);
        options.collector.record('flow', { name: 'battle-end' });
        expect(frames.cancelled).toHaveLength(1);
        expect(options.collector.getEvents().at(-1)).toMatchObject({ type: 'fps', samples: 1 });
    });

    it('ignores the clearing of the collector', () => {
        const { options, frames } = setup();
        installMonitoring(options);
        options.collector.clear();
        expect(frames.callback).toBeNull();
    });

    it('installs only once and gives back the same uninstall', () => {
        const { options } = setup();
        const first = installMonitoring(options);
        const second = installMonitoring(setup().options);
        expect(second).toBe(first);
        expect(FakeObserver.instances).toHaveLength(1);
    });

    it('removes every sensor when uninstalled, and can be installed again', () => {
        const { options, listeners, frames } = setup();
        const uninstall = installMonitoring(options);
        options.collector.record('flow', { name: 'battle-start' });
        uninstall();
        expect(listeners).toEqual({});
        expect(FakeObserver.instances[0].disconnected).toBe(true);
        expect(frames.cancelled).toHaveLength(1);
        options.collector.record('flow', { name: 'battle-start' });
        expect(frames.handle).toBe(1);

        const again = setup();
        installMonitoring(again.options);
        expect(Object.keys(again.listeners)).toContain('error');
    });

    it('still installs the other sensors when one of them fails', () => {
        const { options, listeners } = setup();
        const failing = {
            ...options.collector,
            subscribe: () => {
                throw new Error('no');
            },
        };
        installMonitoring({ ...options, collector: failing });
        expect(Object.keys(listeners)).toContain('error');
        expect(FakeObserver.instances).toHaveLength(1);
    });

    it('installs nothing and does not throw when the window and the observer are broken', () => {
        const { options } = setup();
        const target = {
            addEventListener: () => {
                throw new Error('no');
            },
        };
        class ThrowingObserver {
            static supportedEntryTypes = ['longtask'];
            constructor() {
                throw new Error('no');
            }
        }
        expect(() => installMonitoring({ ...options, target, observerClass: ThrowingObserver })).not.toThrow();
        expect(options.collector.getEvents()).toMatchObject([{ name: 'app-start' }]);
    });

    it('removes every sensor even when one of the removals throws, and can be installed again', () => {
        const { options, frames } = setup();
        const target = {
            addEventListener: () => {},
            removeEventListener: () => {
                throw new Error('no');
            },
        };
        const uninstall = installMonitoring({ ...options, target });
        options.collector.record('flow', { name: 'battle-start' });
        expect(() => uninstall()).not.toThrow();
        expect(FakeObserver.instances[0].disconnected).toBe(true);
        expect(frames.cancelled).toHaveLength(1);
        const again = setup();
        installMonitoring(again.options);
        expect(Object.keys(again.listeners)).toContain('error');
    });

    it('uninstallMonitoring does nothing when nothing is installed', () => {
        expect(() => uninstallMonitoring()).not.toThrow();
    });

    it('works with the browser globals by default', () => {
        const uninstall = installMonitoring();
        expect(monitoring.monitor.getEvents().at(-1)).toMatchObject({ name: 'app-start' });
        window.dispatchEvent(new ErrorEvent('error', { message: 'real', error: new RangeError('real') }));
        expect(monitoring.monitor.getEvents().at(-1)).toMatchObject({ type: 'error', errorType: 'RangeError' });
        uninstall();
        monitoring.monitor.clear();
    });
});
