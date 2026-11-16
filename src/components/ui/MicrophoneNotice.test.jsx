import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MicrophoneNotice from './MicrophoneNotice';

describe('MicrophoneNotice', () => {
    it('tells how to unblock a refused microphone', () => {
        render(<MicrophoneNotice access="denied" onDismiss={() => {}} />);
        expect(screen.getByRole('alert').textContent).toContain('blocked');
    });

    it('tells that there is no microphone', () => {
        render(<MicrophoneNotice access="unavailable" onDismiss={() => {}} />);
        expect(screen.getByRole('alert').textContent).toContain('No microphone');
    });

    it('goes away when dismissed', () => {
        const onDismiss = vi.fn();
        render(<MicrophoneNotice access="denied" onDismiss={onDismiss} />);
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows nothing while asking or once allowed', () => {
        const { rerender } = render(<MicrophoneNotice access="asking" onDismiss={() => {}} />);
        expect(screen.queryByRole('alert')).toBeNull();
        rerender(<MicrophoneNotice access="granted" onDismiss={() => {}} />);
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
