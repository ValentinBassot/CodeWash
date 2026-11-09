import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSeededRandom, random, resetRandomSource, setRandomSource } from './random';

afterEach(() => {
    resetRandomSource();
    vi.restoreAllMocks();
});

describe('random', () => {
    it('uses Math.random by default, read at call time', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.25);
        expect(random()).toBe(0.25);
    });

    it('uses the source set by setRandomSource until it is reset', () => {
        setRandomSource(() => 0.5);
        expect(random()).toBe(0.5);
        resetRandomSource();
        vi.spyOn(Math, 'random').mockReturnValue(0.75);
        expect(random()).toBe(0.75);
    });
});

describe('createSeededRandom', () => {
    it('gives the same sequence for the same seed', () => {
        const a = createSeededRandom(42);
        const b = createSeededRandom(42);
        const first = [a(), a(), a()];
        expect([b(), b(), b()]).toEqual(first);
    });

    it('gives another sequence for another seed', () => {
        expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
    });

    it('stays in [0, 1)', () => {
        const next = createSeededRandom(7);
        for (let i = 0; i < 1000; i++) {
            const value = next();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });
});
