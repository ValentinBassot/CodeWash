import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TypedAnswer from './TypedAnswer';

const typeInto = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const boxes = () => [...document.querySelectorAll('.border-b-4')];
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));

const setup = (kind, answer) => {
    const onRight = vi.fn();
    const onWrong = vi.fn();
    const challenge = { answer };
    const view = render(<TypedAnswer kind={kind} challenge={challenge} onRight={onRight} onWrong={onWrong} />);
    return { onRight, onWrong, challenge, view };
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('TypedAnswer for a number', () => {
    it('shows one box per digit of the answer and a numeric input of that length', () => {
        setup('math', '42');
        expect(boxes()).toHaveLength(2);
        const input = screen.getByLabelText('Your answer');
        expect(input.getAttribute('inputmode')).toBe('numeric');
        expect(input.maxLength).toBe(2);
    });

    it('fills the boxes while typing and keeps digits only', () => {
        setup('math', '42');
        typeInto('Your answer', 'x4');
        expect(boxes().map((box) => box.textContent)).toEqual(['4', '']);
        expect(boxes()[0].className).toContain('border-green-500');
        expect(boxes()[1].className).toContain('border-gray-600');
    });

    it('the right answer is given at once and the input is emptied', () => {
        const { onRight, onWrong } = setup('math', '42');
        typeInto('Your answer', '42');
        expect(onRight).toHaveBeenCalledWith('42');
        expect(onWrong).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Your answer').value).toBe('');
    });

    it('a negative answer can be typed', () => {
        const { onRight } = setup('math', '-1');
        typeInto('Your answer', '-1');
        expect(onRight).toHaveBeenCalledWith('-1');
    });

    it('a wrong answer of the right length is reported, shakes, locks the input, then starts again', () => {
        const { onRight, onWrong } = setup('math', '42');
        typeInto('Your answer', '43');
        expect(onWrong).toHaveBeenCalledTimes(1);
        expect(onRight).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Your answer').disabled).toBe(true);
        expect(document.querySelector('.animate-shake')).not.toBeNull();
        expect(boxes()[0].className).toContain('border-red-500');

        wait(500);
        expect(screen.getByLabelText('Your answer').disabled).toBe(false);
        expect(screen.getByLabelText('Your answer').value).toBe('');
        expect(document.querySelector('.animate-shake')).toBeNull();
    });

    it('the input gets the focus back after a wrong answer', () => {
        setup('math', '42');
        typeInto('Your answer', '43');
        wait(500);
        wait(10);
        expect(document.activeElement).toBe(screen.getByLabelText('Your answer'));
    });

    it('a new challenge empties what was typed', () => {
        const { view, onRight, onWrong } = setup('math', '42');
        typeInto('Your answer', '4');
        view.rerender(<TypedAnswer kind="math" challenge={{ answer: '17' }} onRight={onRight} onWrong={onWrong} />);
        expect(screen.getByLabelText('Your answer').value).toBe('');
    });

    it('leaving before the end of a wrong answer does nothing afterwards', () => {
        const { view } = setup('math', '42');
        typeInto('Your answer', '43');
        view.unmount();
        expect(() => wait(1000)).not.toThrow();
    });
});

describe('TypedAnswer for a word', () => {
    it('upper-cases what is typed and ignores spaces', () => {
        const { onRight } = setup('writing', 'ICE CREAM');
        typeInto('Your spelling', 'ice cream');
        expect(onRight).toHaveBeenCalledWith('ICECREAM');
    });

    it('shows a gap for each space and a box for each letter', () => {
        setup('writing', 'ICE CREAM');
        expect(boxes()).toHaveLength(8);
        expect(document.querySelectorAll('.flex-wrap > div')).toHaveLength(9);
        expect(screen.getByLabelText('Your spelling').maxLength).toBe(8);
    });

    it('puts the typed letters in the boxes around the gap', () => {
        setup('writing', 'AB CD');
        typeInto('Your spelling', 'ABC');
        expect(boxes().map((box) => box.textContent)).toEqual(['A', 'B', 'C', '']);
    });

    it('long words get smaller boxes', () => {
        setup('writing', 'CAT');
        expect(boxes()[0].className).toContain('w-10 h-12 text-2xl');
        document.body.innerHTML = '';
        setup('writing', 'CROCODILE');
        expect(boxes()[0].className).toContain('w-7 h-9 text-lg');
    });

    it('a wrong word of the right length is reported and the input starts again', () => {
        const { onWrong } = setup('writing', 'CAT');
        typeInto('Your spelling', 'cut');
        expect(onWrong).toHaveBeenCalledTimes(1);
        wait(500);
        expect(screen.getByLabelText('Your spelling').value).toBe('');
    });
});
