import { createFpsSampler, installErrorSensor, installLongTaskSensor } from './sensors';
import { monitor } from './monitor';
import { attempt } from './safe';

let uninstallCurrent = null;

export const installMonitoring = ({
    collector = monitor,
    target = globalThis,
    observerClass = globalThis.PerformanceObserver,
    raf = globalThis.requestAnimationFrame?.bind(globalThis),
    caf = globalThis.cancelAnimationFrame?.bind(globalThis),
} = {}) => {
    if (uninstallCurrent) return uninstallCurrent;

    const fps = createFpsSampler({ collector, raf, caf });
    const removers = [
        attempt(() =>
            collector.subscribe((event) => {
                if (event?.type !== 'flow') return;
                if (event.name === 'battle-start') fps.start();
                if (event.name === 'battle-end') fps.stop();
            }),
        ),
        attempt(() => installErrorSensor({ target, collector })),
        attempt(() => installLongTaskSensor({ observerClass, collector })),
        fps.stop,
    ].filter((remove) => typeof remove === 'function');
    collector.record('flow', { name: 'app-start' });

    uninstallCurrent = () => {
        try {
            removers.forEach((remove) => attempt(remove));
        } finally {
            uninstallCurrent = null;
        }
    };
    return uninstallCurrent;
};

export const uninstallMonitoring = () => {
    if (uninstallCurrent) uninstallCurrent();
};
