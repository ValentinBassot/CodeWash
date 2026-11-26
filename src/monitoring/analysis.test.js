import { describe, expect, it } from 'vitest';
import {
    DEFAULT_THRESHOLDS,
    countErrorsByType,
    percentile,
    shouldSuggestTicket,
    summarize,
    summarizeFps,
    summarizeLatency,
    ticketSuggestionReasons,
} from './analysis';

let id = 0;
const event = (type, data = {}) => ({ id: ++id, at: 1000 + id, type, ...data });
const error = (errorType) => event('error', { errorType, message: '', origin: 'window' });
const crash = (errorType = 'TypeError') => event('crash', { errorType, message: 'boom', componentStack: '' });
const latency = (name, durationMs, ok = true) => event('latency', { name, durationMs, ok });
const fps = (average, min, samples) => event('fps', { average, min, samples });
const flow = (name) => event('flow', { name, detail: {} });

describe('percentile', () => {
    it('is the nearest rank of the sorted values', () => {
        const values = [50, 10, 40, 20, 30];
        expect(percentile(values, 50)).toBe(30);
        expect(percentile(values, 95)).toBe(50);
        expect(percentile(values, 0)).toBe(10);
        expect(values).toEqual([50, 10, 40, 20, 30]);
    });

    it('is 0 without values', () => {
        expect(percentile([], 50)).toBe(0);
    });
});

describe('countErrorsByType', () => {
    it('counts the errors by type and ignores the other events', () => {
        const events = [error('TypeError'), error('RangeError'), error('TypeError'), crash(), flow('app-start')];
        expect(countErrorsByType(events)).toEqual({ TypeError: 2, RangeError: 1 });
    });

    it('handles a type with the name of an object property', () => {
        expect(countErrorsByType([error('__proto__')])).toEqual({ ['__proto__']: 1 });
    });
});

describe('summarizeLatency', () => {
    it('gives count, failures, p50, p95 and max for each operation, sorted by name', () => {
        const events = [
            ...[100, 200, 300, 400, 1000].map((ms) => latency('fetch', ms)),
            latency('fetch', 500, false),
            latency('battle', 10),
        ];
        expect(summarizeLatency(events)).toEqual({
            battle: { count: 1, failures: 0, p50: 10, p95: 10, max: 10 },
            fetch: { count: 6, failures: 1, p50: 300, p95: 1000, max: 1000 },
        });
        expect(Object.keys(summarizeLatency(events))).toEqual(['battle', 'fetch']);
    });

    it('is empty without latency', () => {
        expect(summarizeLatency([error('TypeError')])).toEqual({});
    });
});

describe('summarizeFps', () => {
    it('weights the average by the number of seconds measured and keeps the lowest minimum', () => {
        expect(summarizeFps([fps(60, 55, 10), fps(30, 12, 30)])).toEqual({ samples: 40, average: 37.5, min: 12 });
    });

    it('is null without a measure', () => {
        expect(summarizeFps([])).toBeNull();
        expect(summarizeFps([fps(0, 0, 0)])).toBeNull();
    });
});

describe('summarize', () => {
    it('is empty and calm without events', () => {
        expect(summarize([])).toEqual({
            eventCount: 0,
            firstAt: null,
            lastAt: null,
            errors: { total: 0, byType: {} },
            crashes: { total: 0, last: null },
            crashRate: 0,
            latency: {},
            fps: null,
            flows: {},
        });
    });

    it('sums up errors, crashes, latency, fps and key moments', () => {
        const events = [
            flow('app-start'),
            error('TypeError'),
            crash('RangeError'),
            latency('fetch', 100),
            fps(50, 30, 4),
            flow('battle-start'),
            flow('battle-start'),
        ];
        const summary = summarize(events);
        expect(summary).toMatchObject({
            eventCount: 7,
            firstAt: events[0].at,
            lastAt: events[6].at,
            errors: { total: 1, byType: { TypeError: 1 } },
            crashes: { total: 1, last: { errorType: 'RangeError', message: 'boom', at: events[2].at } },
            crashRate: 1,
            fps: { samples: 4, average: 50, min: 30 },
            flows: { 'app-start': 1, 'battle-start': 2 },
        });
        expect(summary.latency.fetch.count).toBe(1);
    });

    it('divides the crashes by the sessions started', () => {
        const events = [flow('app-start'), flow('app-start'), crash(), flow('app-start'), flow('app-start')];
        expect(summarize(events).crashRate).toBe(0.3);
    });

    it('counts at least one session even if the start was dropped from the buffer', () => {
        expect(summarize([crash(), crash()]).crashRate).toBe(2);
    });
});

const calm = () => summarize([flow('app-start'), error('TypeError'), error('TypeError'), latency('fetch', 50)]);

describe('shouldSuggestTicket', () => {
    it('does not suggest anything for a calm session', () => {
        expect(shouldSuggestTicket(calm())).toBe(false);
        expect(shouldSuggestTicket(summarize([]))).toBe(false);
    });

    it('suggests a ticket after one crash', () => {
        expect(shouldSuggestTicket(summarize([crash()]))).toBe(true);
        expect(ticketSuggestionReasons(summarize([crash(), crash()]))).toEqual([{ code: 'crash', count: 2 }]);
    });

    it('suggests a ticket after three errors of the same type, not three different ones', () => {
        const same = summarize([error('TypeError'), error('TypeError'), error('TypeError')]);
        expect(ticketSuggestionReasons(same)).toEqual([{ code: 'repeated-error', errorType: 'TypeError', count: 3 }]);
        const different = summarize([error('TypeError'), error('RangeError'), error('SyntaxError')]);
        expect(shouldSuggestTicket(different)).toBe(false);
    });

    it('suggests a ticket for a slow operation seen at least three times', () => {
        const slow = summarize([latency('fetch', 6000), latency('fetch', 7000), latency('fetch', 5000)]);
        expect(ticketSuggestionReasons(slow)).toEqual([{ code: 'slow-operation', name: 'fetch', p95: 7000 }]);
        expect(shouldSuggestTicket(summarize([latency('fetch', 9000), latency('fetch', 9000)]))).toBe(false);
        expect(
            shouldSuggestTicket(summarize([latency('fetch', 100), latency('fetch', 100), latency('fetch', 100)])),
        ).toBe(false);
    });

    it('suggests a ticket for battles that run under 15 frames per second over ten seconds', () => {
        expect(ticketSuggestionReasons(summarize([fps(10, 4, 12)]))).toEqual([{ code: 'low-fps', average: 10 }]);
        expect(shouldSuggestTicket(summarize([fps(10, 4, 5)]))).toBe(false);
        expect(shouldSuggestTicket(summarize([fps(40, 30, 50)]))).toBe(false);
    });

    it('accepts other thresholds', () => {
        const summary = summarize([error('TypeError'), error('TypeError')]);
        expect(shouldSuggestTicket(summary)).toBe(false);
        expect(shouldSuggestTicket(summary, { ...DEFAULT_THRESHOLDS, sameTypeErrors: 2 })).toBe(true);
    });
});
