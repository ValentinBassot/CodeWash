import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestMicrophoneAccess, resetMicrophoneProvider, setMicrophoneProvider } from './microphone';

afterEach(() => {
    resetMicrophoneProvider();
    vi.unstubAllGlobals();
});

const failing = (name) => vi.fn().mockRejectedValue(Object.assign(new Error(name), { name }));

describe('requestMicrophoneAccess', () => {
    it('is unavailable when the browser cannot capture sound', async () => {
        expect(await requestMicrophoneAccess()).toBe('unavailable');
    });

    it('asks the browser for the microphone, read at call time, and lets go of it at once', async () => {
        const stop = vi.fn();
        const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }, { stop }] });
        vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
        expect(await requestMicrophoneAccess()).toBe('granted');
        expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
        expect(stop).toHaveBeenCalledTimes(2);
    });

    it('says denied when the player or the system refuses', async () => {
        setMicrophoneProvider(() => failing('NotAllowedError'));
        expect(await requestMicrophoneAccess()).toBe('denied');
        setMicrophoneProvider(() => failing('SecurityError'));
        expect(await requestMicrophoneAccess()).toBe('denied');
    });

    it('says unavailable when there is no microphone', async () => {
        setMicrophoneProvider(() => failing('NotFoundError'));
        expect(await requestMicrophoneAccess()).toBe('unavailable');
    });
});
