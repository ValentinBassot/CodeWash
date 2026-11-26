export const measureWith = (collector, name, operation) => {
    const startedAt = collector.now();
    const finish = (ok) => collector.record('latency', { name, durationMs: collector.now() - startedAt, ok });
    let result;
    try {
        result = operation();
    } catch (error) {
        finish(false);
        throw error;
    }
    if (typeof result?.then !== 'function') {
        finish(true);
        return result;
    }
    return result.then(
        (value) => {
            finish(true);
            return value;
        },
        (error) => {
            finish(false);
            throw error;
        },
    );
};
