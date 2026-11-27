import { describe, expect, it } from 'vitest';
import { summarize } from './analysis';
import { toPrometheusText } from './prometheus';

const events = [
    { type: 'flow', name: 'app-start', detail: {}, at: 1 },
    { type: 'flow', name: 'battle-start', detail: { skillId: 'math' }, at: 2 },
    { type: 'error', errorType: 'TypeError', message: 'secret name', origin: 'window', at: 3 },
    { type: 'error', errorType: 'TypeError', message: '', origin: 'window', at: 4 },
    { type: 'crash', errorType: 'RangeError', message: 'boom', componentStack: '', at: 5 },
    { type: 'latency', name: 'fetch', durationMs: 100, ok: true, at: 6 },
    { type: 'latency', name: 'fetch', durationMs: 300, ok: false, at: 7 },
    { type: 'fps', average: 50, min: 30, samples: 4, at: 8 },
];

describe('toPrometheusText', () => {
    const text = toPrometheusText(summarize(events));
    const lines = text.split('\n');

    it('ends with a new line and names every metric in snake_case with the codewash_ prefix', () => {
        expect(text.endsWith('\n')).toBe(true);
        const names = lines.filter((line) => line && !line.startsWith('#')).map((line) => line.split(/[{ ]/)[0]);
        expect(names.length).toBeGreaterThan(0);
        names.forEach((name) => expect(name).toMatch(/^codewash_[a-z0-9_]+$/));
    });

    it('declares a help and a counter or gauge type before the samples of each metric', () => {
        expect(lines).toContain('# TYPE codewash_errors_total counter');
        expect(lines).toContain('# TYPE codewash_crashes_total counter');
        expect(lines).toContain('# TYPE codewash_crash_rate gauge');
        expect(lines).toContain('# TYPE codewash_operation_latency_ms gauge');
        expect(lines.indexOf('# HELP codewash_errors_total Errors of the session, by error type.')).toBe(
            lines.indexOf('# TYPE codewash_errors_total counter') - 1,
        );
    });

    it('gives the samples of the summary', () => {
        expect(lines).toContain('codewash_events 8');
        expect(lines).toContain('codewash_errors_total{error_type="TypeError"} 2');
        expect(lines).toContain('codewash_crashes_total 1');
        expect(lines).toContain('codewash_crash_rate 1');
        expect(lines).toContain('codewash_operation_calls_total{operation="fetch"} 2');
        expect(lines).toContain('codewash_operation_failures_total{operation="fetch"} 1');
        expect(lines).toContain('codewash_operation_latency_ms{operation="fetch",quantile="0.5"} 100');
        expect(lines).toContain('codewash_operation_latency_ms{operation="fetch",quantile="0.95"} 300');
        expect(lines).toContain('codewash_fps_average 50');
        expect(lines).toContain('codewash_fps_min 30');
        expect(lines).toContain('codewash_flow_events_total{flow="battle-start"} 1');
    });

    it('never carries the messages of the errors', () => {
        expect(text).not.toContain('secret name');
        expect(text).not.toContain('boom');
    });

    it('leaves out the metrics without a sample', () => {
        const empty = toPrometheusText(summarize([]));
        expect(empty).not.toContain('codewash_errors_total');
        expect(empty).not.toContain('codewash_fps_average');
        expect(empty).toContain('codewash_events 0');
    });

    it('escapes the quotes, backslashes and new lines of a label value', () => {
        const odd = summarize([{ type: 'error', errorType: 'A"B\\C\nD', message: '', origin: 'window', at: 1 }]);
        expect(toPrometheusText(odd)).toContain('codewash_errors_total{error_type="A\\"B\\\\C\\nD"} 1');
    });
});
