import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useMicrophoneAccess } from './useMicrophoneAccess';
import { resetMicrophoneProvider, setMicrophoneProvider } from '../io/microphone';

afterEach(() => resetMicrophoneProvider());

const providing = (result) => {
    const getUserMedia =
        result === 'granted'
            ? vi.fn().mockResolvedValue({ getTracks: () => [] })
            : vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' }));
    setMicrophoneProvider(() => getUserMedia);
    return getUserMedia;
};

describe('useMicrophoneAccess', () => {
    it('asks as soon as the page opens, once, and gives the answer', async () => {
        const getUserMedia = providing('granted');
        const { result } = renderHook(() => useMicrophoneAccess());
        expect(result.current).toBe('asking');
        await waitFor(() => expect(result.current).toBe('granted'));
        expect(getUserMedia).toHaveBeenCalledTimes(1);
    });

    it('gives denied when the microphone is refused', async () => {
        providing('denied');
        const { result } = renderHook(() => useMicrophoneAccess());
        await waitFor(() => expect(result.current).toBe('denied'));
    });

    it('ignores the answer that comes after the page was left', async () => {
        providing('granted');
        const { result, unmount } = renderHook(() => useMicrophoneAccess());
        unmount();
        await Promise.resolve();
        expect(result.current).toBe('asking');
    });

    it('still asks only once when React runs the effect twice, and still gives the answer', async () => {
        const getUserMedia = providing('granted');
        const { result } = renderHook(() => useMicrophoneAccess(), { wrapper: StrictMode });
        await waitFor(() => expect(result.current).toBe('granted'));
        expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
});
