import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import MemoryGame from './MemoryGame';
import { createSeededRandom, setRandomSource } from '../../../domain/random';

const cards = () => [...document.querySelectorAll('div.perspective-1000')];
const faceOf = (card) => card.querySelectorAll('img')[1].getAttribute('src');
const flipped = () => cards().filter((card) => card.className.includes('rotate-y-180'));
const pairs = () => {
    const byFace = new Map();
    for (const card of cards()) byFace.set(faceOf(card), [...(byFace.get(faceOf(card)) || []), card]);
    return [...byFace.values()];
};
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));
const play = (onWin = vi.fn()) => {
    render(<MemoryGame pairs={2} gridCols={2} cardBack="back.png" onWin={onWin} />);
    return onWin;
};

beforeEach(() => {
    vi.useFakeTimers();
    setRandomSource(createSeededRandom(8));
});

afterEach(() => vi.useRealTimers());

describe('MemoryGame', () => {
    it('deals two cards per pair, face down', () => {
        play();
        expect(cards()).toHaveLength(4);
        expect(flipped()).toHaveLength(0);
        expect(pairs().map((pair) => pair.length)).toEqual([2, 2]);
    });

    it('a matching pair leaves the table', () => {
        play();
        const [[a, b]] = pairs();
        fireEvent.click(a);
        fireEvent.click(b);
        expect(flipped()).toHaveLength(2);
        wait(300);
        expect(cards()).toHaveLength(2);
    });

    it('two different cards turn face down again, and nothing can be flipped meanwhile', () => {
        play();
        const [[a, other], [b]] = pairs();
        fireEvent.click(a);
        fireEvent.click(b);
        fireEvent.click(other);
        expect(flipped()).toHaveLength(2);
        wait(300);
        expect(flipped()).toHaveLength(2);
        wait(500);
        expect(flipped()).toHaveLength(0);
        expect(cards()).toHaveLength(4);
    });

    it('flipping the same card twice does not count as a pair', () => {
        play();
        const [[a]] = pairs();
        fireEvent.click(a);
        fireEvent.click(a);
        wait(300);
        expect(flipped()).toHaveLength(1);
        expect(cards()).toHaveLength(4);
    });

    it('wins half a second after the last pair, once', () => {
        const onWin = play();
        for (const [a, b] of pairs()) {
            fireEvent.click(a);
            fireEvent.click(b);
            wait(300);
        }
        expect(onWin).not.toHaveBeenCalled();
        wait(500);
        expect(onWin).toHaveBeenCalledTimes(1);
        expect(onWin).toHaveBeenCalledWith({ perfect: true });
    });

    it('leaving the game before the win is announced cancels it', () => {
        const onWin = vi.fn();
        const { unmount } = render(<MemoryGame pairs={2} gridCols={2} cardBack="back.png" onWin={onWin} />);
        for (const [a, b] of pairs()) {
            fireEvent.click(a);
            fireEvent.click(b);
            wait(300);
        }
        unmount();
        wait(2000);
        expect(onWin).not.toHaveBeenCalled();
    });

    it('a win after a mismatch is not perfect', () => {
        const onWin = play();
        const [[a], [b]] = pairs();
        fireEvent.click(a);
        fireEvent.click(b);
        wait(800);
        for (const [first, second] of pairs()) {
            fireEvent.click(first);
            fireEvent.click(second);
            wait(300);
        }
        wait(500);
        expect(onWin).toHaveBeenCalledWith({ perfect: false });
    });
});
