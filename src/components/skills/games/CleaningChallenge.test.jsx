import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CleaningChallenge from './CleaningChallenge';

const typeCode = (code) => fireEvent.change(document.querySelector('input'), { target: { value: code } });

describe('CleaningChallenge', () => {
    it('asks the parent before completing', () => {
        const onComplete = vi.fn();
        render(<CleaningChallenge onComplete={onComplete} />);
        expect(document.querySelector('input')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
        expect(document.querySelector('input')).not.toBeNull();
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('completes once the parent gives the right code, and closes the question', () => {
        const onComplete = vi.fn();
        render(<CleaningChallenge onComplete={onComplete} />);
        fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
        typeCode('floppydisk');
        fireEvent.submit(document.querySelector('form'));

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(document.querySelector('input')).toBeNull();
    });

    it('does not complete with a wrong code', () => {
        const onComplete = vi.fn();
        render(<CleaningChallenge onComplete={onComplete} />);
        fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
        typeCode('nope');
        fireEvent.submit(document.querySelector('form'));

        expect(onComplete).not.toHaveBeenCalled();
        expect(document.querySelector('input')).not.toBeNull();
    });

    it('closes the question without completing when it is dismissed', () => {
        const onComplete = vi.fn();
        render(<CleaningChallenge onComplete={onComplete} />);
        fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
        fireEvent.click(document.querySelector('div.absolute.inset-0.bg-black\\/70'));

        expect(document.querySelector('input')).toBeNull();
        expect(onComplete).not.toHaveBeenCalled();
    });
});
