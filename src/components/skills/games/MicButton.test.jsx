import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MicButton from './MicButton';

describe('MicButton', () => {
    it('invites to speak when the microphone is off', () => {
        render(<MicButton isListening={false} onClick={() => {}} />);
        expect(screen.getByText('Tap to Speak')).toBeTruthy();
        expect(screen.getByRole('button').className).toContain('border-gray-600');
    });

    it('shows a red pulsing microphone while listening', () => {
        render(<MicButton isListening onClick={() => {}} />);
        expect(screen.queryByText('Tap to Speak')).toBeNull();
        expect(document.querySelector('.animate-pulse')).not.toBeNull();
        expect(screen.getByRole('button').className).toContain('border-red-500');
    });

    it('calls back when pressed', () => {
        const onClick = vi.fn();
        render(<MicButton isListening={false} onClick={onClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
