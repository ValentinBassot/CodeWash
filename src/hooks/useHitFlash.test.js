import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHitFlash } from './useHitFlash';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useHitFlash', () => {
    it('does not flash at the start, even with numbers already on screen', () => {
        const { result } = renderHook(({ count }) => useHitFlash(count), { initialProps: { count: 2 } });
        expect(result.current).toBe(false);
    });

    it('flashes when a number is added, then stops after 400 ms', () => {
        const { result, rerender } = renderHook(({ count }) => useHitFlash(count), { initialProps: { count: 0 } });
        rerender({ count: 1 });
        expect(result.current).toBe(true);
        act(() => vi.advanceTimersByTime(399));
        expect(result.current).toBe(true);
        act(() => vi.advanceTimersByTime(1));
        expect(result.current).toBe(false);
    });

    it('does not flash when numbers disappear', () => {
        const { result, rerender } = renderHook(({ count }) => useHitFlash(count), { initialProps: { count: 2 } });
        rerender({ count: 1 });
        expect(result.current).toBe(false);
    });

    it('a second hit restarts the 400 ms', () => {
        const { result, rerender } = renderHook(({ count }) => useHitFlash(count), { initialProps: { count: 0 } });
        rerender({ count: 1 });
        act(() => vi.advanceTimersByTime(300));
        rerender({ count: 2 });
        act(() => vi.advanceTimersByTime(300));
        expect(result.current).toBe(true);
        act(() => vi.advanceTimersByTime(100));
        expect(result.current).toBe(false);
    });

    it('leaves no timer behind when it unmounts', () => {
        const { rerender, unmount } = renderHook(({ count }) => useHitFlash(count), { initialProps: { count: 0 } });
        rerender({ count: 1 });
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
