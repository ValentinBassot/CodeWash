export const DEFAULT_THRESHOLDS = {
    crashes: 1,
    sameTypeErrors: 3,
    slowOperationP95Ms: 5000,
    slowOperationMinSamples: 3,
    lowFpsAverage: 15,
    lowFpsMinSamples: 10,
};

const round1 = (value) => Math.round(value * 10) / 10;

export const percentile = (values, p) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
};

const ofType = (events, type) => events.filter((event) => event.type === type);

const countBy = (items, keyOf) => {
    const counts = new Map();
    items.forEach((item) => counts.set(keyOf(item), (counts.get(keyOf(item)) || 0) + 1));
    return Object.fromEntries(counts);
};

export const countErrorsByType = (events) => countBy(ofType(events, 'error'), (event) => event.errorType);

export const summarizeLatency = (events) => {
    const byName = new Map();
    ofType(events, 'latency').forEach((event) => {
        if (!byName.has(event.name)) byName.set(event.name, []);
        byName.get(event.name).push(event);
    });
    return Object.fromEntries(
        [...byName.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, entries]) => {
                const durations = entries.map((entry) => entry.durationMs);
                return [
                    name,
                    {
                        count: entries.length,
                        failures: entries.filter((entry) => !entry.ok).length,
                        p50: percentile(durations, 50),
                        p95: percentile(durations, 95),
                        max: Math.max(...durations),
                    },
                ];
            }),
    );
};

export const summarizeFps = (events) => {
    const entries = ofType(events, 'fps').filter((event) => event.samples > 0);
    if (entries.length === 0) return null;
    const samples = entries.reduce((sum, entry) => sum + entry.samples, 0);
    const weighted = entries.reduce((sum, entry) => sum + entry.average * entry.samples, 0);
    return {
        samples,
        average: round1(weighted / samples),
        min: Math.min(...entries.map((entry) => entry.min)),
    };
};

export const summarize = (events) => {
    const crashes = ofType(events, 'crash');
    const lastCrash = crashes.at(-1);
    const sessions = Math.max(1, ofType(events, 'flow').filter((event) => event.name === 'app-start').length);
    return {
        eventCount: events.length,
        firstAt: events.length > 0 ? events[0].at : null,
        lastAt: events.length > 0 ? events.at(-1).at : null,
        errors: {
            total: ofType(events, 'error').length,
            byType: countErrorsByType(events),
        },
        crashes: {
            total: crashes.length,
            last: lastCrash ? { errorType: lastCrash.errorType, message: lastCrash.message, at: lastCrash.at } : null,
        },
        crashRate: round1(crashes.length / sessions),
        latency: summarizeLatency(events),
        fps: summarizeFps(events),
        flows: countBy(ofType(events, 'flow'), (event) => event.name),
    };
};

export const ticketSuggestionReasons = (summary, thresholds = DEFAULT_THRESHOLDS) => {
    const reasons = [];
    if (summary.crashes.total >= thresholds.crashes) {
        reasons.push({ code: 'crash', count: summary.crashes.total });
    }
    Object.entries(summary.errors.byType).forEach(([errorType, count]) => {
        if (count >= thresholds.sameTypeErrors) reasons.push({ code: 'repeated-error', errorType, count });
    });
    Object.entries(summary.latency).forEach(([name, stats]) => {
        if (stats.count >= thresholds.slowOperationMinSamples && stats.p95 >= thresholds.slowOperationP95Ms) {
            reasons.push({ code: 'slow-operation', name, p95: stats.p95 });
        }
    });
    if (
        summary.fps &&
        summary.fps.samples >= thresholds.lowFpsMinSamples &&
        summary.fps.average < thresholds.lowFpsAverage
    ) {
        reasons.push({ code: 'low-fps', average: summary.fps.average });
    }
    return reasons;
};

export const shouldSuggestTicket = (summary, thresholds = DEFAULT_THRESHOLDS) =>
    ticketSuggestionReasons(summary, thresholds).length > 0;
