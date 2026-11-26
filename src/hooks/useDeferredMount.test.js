import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { IDLE_FALLBACK_MS, IDLE_TIMEOUT_MS, useDeferredMount, whenIdle } from './useDeferredMount';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('whenIdle', () => {
    it('falls back to a timer when the browser has no idle callback', () => {
        const callback = vi.fn();
        whenIdle(callback);
        vi.advanceTimersByTime(IDLE_FALLBACK_MS - 1);
        expect(callback).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('can be cancelled before the timer fires', () => {
        const callback = vi.fn();
        const cancel = whenIdle(callback);
        cancel();
        vi.advanceTimersByTime(IDLE_FALLBACK_MS * 2);
        expect(callback).not.toHaveBeenCalled();
    });

    it('uses the idle callback of the browser with a timeout, and can cancel it', () => {
        const requestIdleCallback = vi.fn(() => 7);
        const cancelIdleCallback = vi.fn();
        vi.stubGlobal('requestIdleCallback', requestIdleCallback);
        vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);
        const callback = vi.fn();
        const cancel = whenIdle(callback);
        expect(requestIdleCallback).toHaveBeenCalledWith(callback, { timeout: IDLE_TIMEOUT_MS });
        cancel();
        expect(cancelIdleCallback).toHaveBeenCalledWith(7);
    });
});

describe('useDeferredMount', () => {
    it('does not mount while closed and not idle yet', () => {
        const { result } = renderHook(() => useDeferredMount(false));
        expect(result.current).toBe(false);
    });

    it('mounts once the browser is idle', () => {
        const { result } = renderHook(() => useDeferredMount(false));
        act(() => vi.advanceTimersByTime(IDLE_FALLBACK_MS));
        expect(result.current).toBe(true);
    });

    it('mounts at once when opened before the idle time', () => {
        const { result, rerender } = renderHook(({ open }) => useDeferredMount(open), {
            initialProps: { open: false },
        });
        rerender({ open: true });
        expect(result.current).toBe(true);
    });

    it('stays mounted after closing so the slide-out keeps its content', () => {
        const { result, rerender } = renderHook(({ open }) => useDeferredMount(open), {
            initialProps: { open: true },
        });
        rerender({ open: false });
        expect(result.current).toBe(true);
    });

    it('cancels the idle wait when unmounted', () => {
        const { result, unmount } = renderHook(() => useDeferredMount(false));
        unmount();
        act(() => vi.advanceTimersByTime(IDLE_FALLBACK_MS * 2));
        expect(result.current).toBe(false);
    });
});
