import { attempt } from './safe';

const noop = () => {};

export const installErrorSensor = ({ target, collector }) => {
    const onError = (event) =>
        attempt(() =>
            collector.record('error', {
                origin: 'window',
                errorType: event.error?.name,
                message: event.message ?? event.error?.message,
            }),
        );
    const onRejection = (event) =>
        attempt(() => {
            const reason = event.reason;
            return collector.record('error', {
                origin: 'promise',
                errorType: reason?.name ?? 'UnhandledRejection',
                message: reason?.message ?? reason,
            });
        });
    const added = [];
    const removeAll = () =>
        added.splice(0).forEach(([type, handler]) => attempt(() => target.removeEventListener(type, handler)));
    try {
        [
            ['error', onError],
            ['unhandledrejection', onRejection],
        ].forEach(([type, handler]) => {
            target.addEventListener(type, handler);
            added.push([type, handler]);
        });
    } catch {
        removeAll();
        return noop;
    }
    return removeAll;
};

const LONG_TASK_MIN_GAP_MS = 1000;

export const installLongTaskSensor = ({ observerClass, collector }) => {
    if (typeof observerClass !== 'function') return noop;
    if (!observerClass.supportedEntryTypes?.includes('longtask')) return noop;
    let lastRecordedAt = null;
    const onEntries = (list) =>
        attempt(() =>
            list.getEntries().forEach((entry) => {
                const at = collector.now();
                if (lastRecordedAt !== null && at - lastRecordedAt < LONG_TASK_MIN_GAP_MS) return;
                lastRecordedAt = at;
                collector.record('latency', { name: 'longtask', durationMs: entry.duration });
            }),
        );
    try {
        const observer = new observerClass(onEntries);
        observer.observe({ entryTypes: ['longtask'] });
        return () => observer.disconnect();
    } catch {
        return noop;
    }
};

const WINDOW_MS = 1000;
const FLUSH_EVERY = 10;
const MAX_WINDOW_MS = 3000;

export const createFpsSampler = ({ collector, raf, caf, windowMs = WINDOW_MS, flushEvery = FLUSH_EVERY }) => {
    let handle = null;
    let running = false;
    let windowStart = null;
    let frames = 0;
    let rates = [];

    const flush = () => {
        if (rates.length === 0) return;
        const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        collector.record('fps', { average, min: Math.min(...rates), samples: rates.length });
        rates = [];
    };

    const onFrame = (timestamp) => {
        frames += 1;
        if (windowStart === null) {
            windowStart = timestamp;
            frames = 0;
        }
        const elapsed = timestamp - windowStart;
        if (elapsed >= windowMs) {
            if (elapsed <= MAX_WINDOW_MS) rates.push((frames * 1000) / elapsed);
            windowStart = timestamp;
            frames = 0;
            if (rates.length >= flushEvery) flush();
        }
        handle = raf(onFrame);
    };

    const start = () => {
        if (running || typeof raf !== 'function' || typeof caf !== 'function') return;
        running = true;
        windowStart = null;
        frames = 0;
        handle = raf(onFrame);
    };

    const stop = () => {
        if (!running) return;
        running = false;
        caf(handle);
        flush();
    };

    return { start, stop, isRunning: () => running };
};
