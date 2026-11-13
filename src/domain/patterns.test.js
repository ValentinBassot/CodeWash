import { describe, expect, it } from 'vitest';
import { MAX_TEMPO_DELAY, MIN_TEMPO_DELAY, clamp, getTempoDelays, lerp } from './patterns';

describe('clamp', () => {
    it('keeps a value inside its bounds', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-3, 0, 10)).toBe(0);
        expect(clamp(42, 0, 10)).toBe(10);
    });
});

describe('lerp', () => {
    it('moves from start to end as t goes from 0 to 1', () => {
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 0.5)).toBe(5);
        expect(lerp(0, 10, 1)).toBe(10);
    });

    it('never goes past either end', () => {
        expect(lerp(0, 10, -1)).toBe(0);
        expect(lerp(0, 10, 2)).toBe(10);
    });
});

describe('getTempoDelays', () => {
    it('starts slow at difficulty 1 and slows nothing below the maximum', () => {
        expect(getTempoDelays(0, 1)).toEqual({ onDelay: MAX_TEMPO_DELAY, offDelay: 280 });
    });

    it('speeds up with the rounds at difficulty 1 until the minimum', () => {
        const rounds = [0, 3, 6, 9, 20].map((n) => getTempoDelays(n, 1).onDelay);
        expect(rounds).toEqual([...rounds].sort((a, b) => b - a));
        expect(rounds[0]).toBe(MAX_TEMPO_DELAY);
        expect(rounds[4]).toBe(MIN_TEMPO_DELAY);
    });

    it('is always at the fastest tempo at difficulty 7', () => {
        expect(getTempoDelays(0, 7)).toEqual({ onDelay: MIN_TEMPO_DELAY, offDelay: 100 });
        expect(getTempoDelays(5, 7)).toEqual({ onDelay: MIN_TEMPO_DELAY, offDelay: 100 });
    });

    it('starts faster at a higher difficulty', () => {
        expect(getTempoDelays(0, 4).onDelay).toBe(500);
        expect(getTempoDelays(0, 4).onDelay).toBeLessThan(getTempoDelays(0, 1).onDelay);
    });
});
