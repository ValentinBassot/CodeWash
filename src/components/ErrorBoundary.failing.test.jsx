import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

vi.mock('../monitoring', () => ({
    recordCrash: () => {
        throw new Error('monitoring is down');
    },
}));

const Broken = () => {
    throw new TypeError('render failed');
};

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary when the monitoring fails', () => {
    it('still shows the fallback screen and its reload button', () => {
        const onReload = vi.fn();
        render(
            <ErrorBoundary onReload={onReload}>
                <Broken />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert').textContent).toContain('Something went wrong');
        fireEvent.click(screen.getByRole('button', { name: 'Reload the game' }));
        expect(onReload).toHaveBeenCalledTimes(1);
    });
});
