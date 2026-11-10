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

    it('KNOWN DEBT D22: uses the UTC day, so 23:30 UTC on the 12th is still the 12th everywhere', () => {
        setClock(() => Date.parse('2026-11-12T23:30:00Z'));
        expect(todayKey()).toBe('2026-11-12');
    });
});
