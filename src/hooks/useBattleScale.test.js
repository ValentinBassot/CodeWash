import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { fitScale, useBattleScale } from './useBattleScale';

const resizeTo = (width, height) => {
    window.innerWidth = width;
    window.innerHeight = height;
    act(() => window.dispatchEvent(new Event('resize')));
};

afterEach(() => resizeTo(1024, 768));

describe('fitScale', () => {
    it('keeps the full zoom on a big screen', () => {
        expect(fitScale(1920, 1080)).toBe(1.5);
    });

    it('shrinks to fit the height of a laptop screen and leave room for the hearts', () => {
        expect(fitScale(1280, 800)).toBeCloseTo(1.16, 3);
    });

    it('shrinks to fit the width of a phone', () => {
        expect(fitScale(390, 844)).toBeCloseTo(1.1933, 3);
    });

    it('shrinks below 1 on a very small screen', () => {
        expect(fitScale(320, 480)).toBeLessThan(1);
    });
});

describe('useBattleScale', () => {
    it('follows the size of the window', () => {
        resizeTo(1920, 1080);
        const { result } = renderHook(() => useBattleScale());
        expect(result.current).toEqual({ scale: 1.5, showPanel: true });

        resizeTo(390, 844);
        expect(result.current.showPanel).toBe(false);
        expect(result.current.scale).toBeCloseTo(1.1933, 3);
    });
});
