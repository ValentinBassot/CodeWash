import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { resetMicrophoneProvider, setMicrophoneProvider } from './io/microphone';

const answering = (name) => {
    const getUserMedia = name
        ? vi.fn().mockRejectedValue(Object.assign(new Error(name), { name }))
        : vi.fn().mockResolvedValue({ getTracks: () => [] });
    setMicrophoneProvider(() => getUserMedia);
    return getUserMedia;
};

beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
});

afterEach(() => {
    resetMicrophoneProvider();
    vi.restoreAllMocks();
});

describe('microphone permission when the page opens', () => {
    it('asks for the microphone once, as soon as the game opens, without any click', async () => {
        const getUserMedia = answering(null);
        render(<App />);
        await waitFor(() => expect(getUserMedia).toHaveBeenCalledWith({ audio: true }));
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('tells how to unblock the microphone when it is refused, and the notice can be dismissed', async () => {
        answering('NotAllowedError');
        render(<App />);
        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('blocked');

        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('tells that there is no microphone when the computer has none', async () => {
        answering('NotFoundError');
        render(<App />);
        expect((await screen.findByRole('alert')).textContent).toContain('No microphone');
    });
});
