import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TypedWord from './TypedWord';

const type = (text) => fireEvent.change(screen.getByLabelText('Type the word'), { target: { value: text } });

describe('TypedWord', () => {
    it('gives the word typed when the form is sent, then empties the box', () => {
        const onSubmit = vi.fn();
        render(<TypedWord onSubmit={onSubmit} />);
        type('cat');
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        expect(onSubmit).toHaveBeenCalledWith('cat');
        expect(screen.getByLabelText('Type the word').value).toBe('');
    });

    it('sends the form with the Enter key too', () => {
        const onSubmit = vi.fn();
        render(<TypedWord onSubmit={onSubmit} />);
        type('dog');
        fireEvent.submit(screen.getByLabelText('Type the word').closest('form'));
        expect(onSubmit).toHaveBeenCalledWith('dog');
    });
});
