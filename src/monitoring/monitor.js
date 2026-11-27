import { createCollector } from './collector';
import { measureWith } from './measure';
import { attempt } from './safe';

export const monitor = createCollector();

export const recordFlow = (name, detail) => monitor.record('flow', { name, detail });

export const recordCrash = (error, componentStack) =>
    monitor.record('crash', {
        errorType: attempt(() => error?.name),
        message: attempt(() => error?.message),
        componentStack,
    });

export const measure = (name, operation) => measureWith(monitor, name, operation);
