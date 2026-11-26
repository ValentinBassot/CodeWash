import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import LoadingGate from './LoadingGate';
import { FADE_OUT_MS } from './LoadingScreen';

const Game = () => <main>The game</main>;

const deferred = () => {
    const control = {};
    control.promise = new Promise((resolve, reject) => {
        control.resolve = resolve;
        control.reject = reject;
    });
    return control;
};

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('LoadingGate', () => {
    it('shows the loading screen at 0% and no game while loading', () => {
        const load = vi.fn(() => deferred().promise);
        render(<LoadingGate load={load} />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
        expect(screen.getByText('0%')).toBeTruthy();
        expect(screen.queryByText('The game')).toBeNull();
    });

    it('passes the label to the loading screen', () => {
        render(<LoadingGate load={() => deferred().promise} label="Chargement" />);
        expect(screen.getByRole('progressbar', { name: 'Chargement' })).toBeTruthy();
    });

    it('follows the real progress reported by the loader', async () => {
        const pending = deferred();
        let report;
        render(
            <LoadingGate
                load={(onProgress) => {
                    report = onProgress;
                    return pending.promise;
                }}
            />,
        );
        act(() => report(37));
        expect(screen.getByText('37%')).toBeTruthy();
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('37');
        expect(screen.queryByText('The game')).toBeNull();
    });

    it('shows the game at 100% then removes the loading screen after the fade', async () => {
        const pending = deferred();
        render(<LoadingGate load={() => pending.promise} />);
        await act(async () => pending.resolve(Game));
        expect(screen.getByText('The game')).toBeTruthy();
        expect(screen.getByText('100%')).toBeTruthy();
        expect(screen.getByRole('progressbar').className).toContain('boot-leaving');
        act(() => vi.advanceTimersByTime(FADE_OUT_MS));
        expect(screen.queryByRole('progressbar')).toBeNull();
        expect(screen.getByText('The game')).toBeTruthy();
    });

    it('keeps the loading screen and offers a reload when loading fails', async () => {
        const pending = deferred();
        render(<LoadingGate load={() => pending.promise} />);
        await act(async () => {
            pending.reject(new Error('offline'));
        });
        expect(screen.getByRole('alert').textContent).toContain('could not be loaded');
        expect(screen.queryByText('The game')).toBeNull();
    });

    it('ignores the result when it is unmounted before the loading ends', async () => {
        const pending = deferred();
        const { unmount } = render(<LoadingGate load={() => pending.promise} />);
        unmount();
        await act(async () => pending.resolve(Game));
        expect(screen.queryByText('The game')).toBeNull();
    });

    it('ignores a failure when it is unmounted before the loading ends', async () => {
        const pending = deferred();
        const { unmount } = render(<LoadingGate load={() => pending.promise} />);
        unmount();
        await act(async () => {
            pending.reject(new Error('offline'));
        });
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
