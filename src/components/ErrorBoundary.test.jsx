import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { monitor } from '../monitoring';

const Broken = () => {
    throw new TypeError('render failed');
};

beforeEach(() => {
    monitor.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    monitor.clear();
    vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
    it('shows its children while nothing fails', () => {
        render(
            <ErrorBoundary>
                <p>the game</p>
            </ErrorBoundary>,
        );
        expect(screen.getByText('the game')).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('records the crash of a render error in the monitoring', () => {
        render(
            <ErrorBoundary>
                <Broken />
            </ErrorBoundary>,
        );
        expect(monitor.getEvents()).toMatchObject([
            { type: 'crash', errorType: 'TypeError', message: 'render failed' },
        ]);
        expect(monitor.getEvents()[0].componentStack).toContain('Broken');
    });

    it('replaces the game with a clear screen and its technical detail', () => {
        render(
            <ErrorBoundary>
                <Broken />
            </ErrorBoundary>,
        );
        const screenText = screen.getByRole('alert').textContent;
        expect(screenText).toContain('Something went wrong');
        expect(screenText).toContain('Your progress is saved');
        expect(screenText).toContain('TypeError - render failed');
    });

    it('reloads the page with the button', () => {
        const onReload = vi.fn();
        render(
            <ErrorBoundary onReload={onReload}>
                <Broken />
            </ErrorBoundary>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Reload the game' }));
        expect(onReload).toHaveBeenCalledTimes(1);
    });

    it('reloads the window by default', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { ...window.location, reload });
        render(
            <ErrorBoundary>
                <Broken />
            </ErrorBoundary>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Reload the game' }));
        expect(reload).toHaveBeenCalledTimes(1);
        vi.unstubAllGlobals();
    });

    it('also catches a thrown value that is not an error', () => {
        const ThrowsNothing = () => {
            throw undefined;
        };
        render(
            <ErrorBoundary onReload={() => {}}>
                <ThrowsNothing />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert').textContent).toContain('Error - ');
        expect(monitor.getEvents()[0]).toMatchObject({ type: 'crash', errorType: 'Error' });
    });

    it('shows the message without the text it quotes, on the screen and in the monitoring', () => {
        const Leaky = () => {
            throw new SyntaxError(`Unexpected token 'z', ..."name":"Alice","hp":zzz}" is not valid JSON`);
        };
        render(
            <ErrorBoundary onReload={() => {}}>
                <Leaky />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert').textContent).toContain('SyntaxError - Unexpected token ,');
        expect(screen.getByRole('alert').textContent).not.toContain('Alice');
        expect(JSON.stringify(monitor.getEvents())).not.toContain('Alice');
    });

    it('shows the screen even when the error cannot be read', () => {
        const Hostile = () => {
            throw {
                get name() {
                    throw new Error('no');
                },
            };
        };
        render(
            <ErrorBoundary onReload={() => {}}>
                <Hostile />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert').textContent).toContain('Something went wrong');
    });
});
