import { afterEach, describe, expect, it, vi } from 'vitest';
import { now, resetClock, setClock, todayKey } from './clock';

afterEach(() => {
    resetClock();
    vi.useRealTimers();
});

describe('now', () => {
    it('reads Date.now by default, at call time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-12T08:00:00Z'));
        expect(now()).toBe(Date.parse('2026-11-12T08:00:00Z'));
    });

    it('uses the clock set by setClock until it is reset', () => {
        setClock(() => 1234);
        expect(now()).toBe(1234);
        resetClock();
        expect(now()).not.toBe(1234);
    });
});

describe('todayKey', () => {
    it('is the YYYY-MM-DD day of now()', () => {
        setClock(() => Date.parse('2026-11-12T08:00:00Z'));
        expect(todayKey()).toBe('2026-11-12');
    });

    it('uses the local day: 23:30 UTC on the 12th is already the 13th in Paris', () => {
        setClock(() => Date.parse('2026-11-12T23:30:00Z'));
        expect(todayKey()).toBe('2026-11-13');
    });

    it('pads month and day with zeros', () => {
        setClock(() => Date.parse('2026-03-05T12:00:00Z'));
        expect(todayKey()).toBe('2026-03-05');
    });
});
