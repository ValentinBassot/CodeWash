const escapeLabel = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

const labelText = (labels) => {
    const pairs = Object.entries(labels).map(([key, value]) => `${key}="${escapeLabel(value)}"`);
    return pairs.length > 0 ? `{${pairs.join(',')}}` : '';
};

const metric = (name, type, help, samples) => {
    if (samples.length === 0) return [];
    return [
        `# HELP ${name} ${help}`,
        `# TYPE ${name} ${type}`,
        ...samples.map(({ labels = {}, value }) => `${name}${labelText(labels)} ${value}`),
    ];
};

export const toPrometheusText = (summary) => {
    const operations = Object.entries(summary.latency);
    const lines = [
        ...metric('codewash_events', 'gauge', 'Events held in the session buffer.', [{ value: summary.eventCount }]),
        ...metric(
            'codewash_errors_total',
            'counter',
            'Errors of the session, by error type.',
            Object.entries(summary.errors.byType).map(([type, count]) => ({
                labels: { error_type: type },
                value: count,
            })),
        ),
        ...metric('codewash_crashes_total', 'counter', 'Crashes of the session.', [{ value: summary.crashes.total }]),
        ...metric('codewash_crash_rate', 'gauge', 'Crashes per session started.', [{ value: summary.crashRate }]),
        ...metric(
            'codewash_operation_calls_total',
            'counter',
            'Measured operations, by name.',
            operations.map(([operation, stats]) => ({ labels: { operation }, value: stats.count })),
        ),
        ...metric(
            'codewash_operation_failures_total',
            'counter',
            'Measured operations that failed, by name.',
            operations.map(([operation, stats]) => ({ labels: { operation }, value: stats.failures })),
        ),
        ...metric(
            'codewash_operation_latency_ms',
            'gauge',
            'Latency of the measured operations in milliseconds, by quantile.',
            operations.flatMap(([operation, stats]) => [
                { labels: { operation, quantile: '0.5' }, value: stats.p50 },
                { labels: { operation, quantile: '0.95' }, value: stats.p95 },
            ]),
        ),
        ...metric(
            'codewash_fps_average',
            'gauge',
            'Average frames per second during battles.',
            summary.fps ? [{ value: summary.fps.average }] : [],
        ),
        ...metric(
            'codewash_fps_min',
            'gauge',
            'Lowest frames per second during battles.',
            summary.fps ? [{ value: summary.fps.min }] : [],
        ),
        ...metric(
            'codewash_flow_events_total',
            'counter',
            'Key moments of the app, by name.',
            Object.entries(summary.flows).map(([flow, count]) => ({ labels: { flow }, value: count })),
        ),
    ];
    return `${lines.join('\n')}\n`;
};
