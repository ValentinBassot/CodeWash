import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('LoadingScreen', () => {
    it('shows the percentage and exposes it as a progress bar', () => {
        render(<LoadingScreen percent={42} />);
        expect(screen.getByText('42%')).toBeTruthy();
        const bar = screen.getByRole('progressbar', { name: 'Loading' });
        expect(bar.getAttribute('aria-valuenow')).toBe('42');
        expect(bar.getAttribute('aria-valuemin')).toBe('0');
        expect(bar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('fills the bar in proportion to the percentage', () => {
        const { container } = render(<LoadingScreen percent={25} />);
        expect(container.querySelector('.boot-fill').style.transform).toBe('scaleX(0.25)');
    });

    it('shows the title and takes a translated label', () => {
        render(<LoadingScreen percent={0} label="Chargement" />);
        expect(screen.getByRole('heading', { name: 'Level Up!' })).toBeTruthy();
        expect(screen.getByRole('progressbar', { name: 'Chargement' })).toBeTruthy();
    });

    it('fades out when leaving', () => {
        const { rerender } = render(<LoadingScreen percent={100} />);
        expect(screen.getByRole('progressbar').className).toBe('boot');
        rerender(<LoadingScreen percent={100} leaving />);
        expect(screen.getByRole('progressbar').className).toContain('boot-leaving');
    });

    it('shows no error while loading', () => {
        render(<LoadingScreen percent={10} />);
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('offers to reload when the game could not be loaded', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { reload });
        render(<LoadingScreen percent={45} failed />);
        expect(screen.getByRole('alert').textContent).toContain('could not be loaded');
        fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
        expect(reload).toHaveBeenCalledTimes(1);
    });
});
