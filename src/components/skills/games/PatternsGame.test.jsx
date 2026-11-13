import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PatternsGame from './PatternsGame';
import { BASE_ASSETS } from '../../../constants/gameData';
import { createSeededRandom, setRandomSource } from '../../../domain/random';
import { playAxolotlNote, playMatch, playMismatch } from '../../../utils/soundManager';

vi.mock('../../../utils/soundManager', () => ({
    playAxolotlNote: vi.fn(),
    playMatch: vi.fn(),
    playMismatch: vi.fn(),
}));

const COLORS = Object.keys(BASE_ASSETS.axolotls);
const axolotl = (color) => screen.getByText(color, { selector: 'span' }).parentElement;
const shown = () => COLORS.filter((color) => screen.queryByText(color, { selector: 'span' }));
const lit = () =>
    [...document.querySelectorAll('.ring-yellow-400')].map((e) => e.textContent).find((t) => COLORS.includes(t)) ??
    null;
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));
const nextTimer = () => act(() => vi.advanceTimersToNextTimer());
const watch = () => {
    const seen = [];
    let previous = null;
    for (let n = 0; n < 2000 && !screen.queryByText('Your turn!'); n++) {
        nextTimer();
        const color = lit();
        if (color && color !== previous) seen.push(color);
        previous = color;
    }
    return seen;
};
const repeat = (sequence) => sequence.forEach((color) => fireEvent.click(axolotl(color)));
const play = (difficulty = 1, onRoundWon = vi.fn()) => {
    render(<PatternsGame difficulty={difficulty} onRoundWon={onRoundWon} />);
    return onRoundWon;
};
const other = (color) => COLORS.find((c) => shown().includes(c) && c !== color);

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setRandomSource(createSeededRandom(5));
});

afterEach(() => vi.useRealTimers());

describe('PatternsGame', () => {
    it('shows the axolotls of the difficulty and lights up a sequence of one while the player watches', () => {
        play();
        expect(shown()).toEqual(COLORS.slice(0, 2));
        expect(screen.getByText('Round:', { exact: false }).textContent).toContain('Round: 0');
        expect(screen.getByText('Watch!')).toBeTruthy();
        expect(watch()).toHaveLength(1);
        expect(screen.getByText('Your turn!')).toBeTruthy();
        expect(playAxolotlNote).toHaveBeenCalledTimes(1);
    });

    it('uses all eight axolotls at difficulty 7 and two for an unknown difficulty', () => {
        play(7);
        expect(shown()).toEqual(COLORS);
    });

    it('falls back to two axolotls for an unknown difficulty', () => {
        play(99);
        expect(shown()).toEqual(COLORS.slice(0, 2));
    });

    it('ignores clicks while the sequence is shown', () => {
        play();
        fireEvent.click(axolotl('Pink'));
        expect(playAxolotlNote).not.toHaveBeenCalled();
        expect(playMismatch).not.toHaveBeenCalled();
        expect(screen.getByText('Watch!')).toBeTruthy();
    });

    it('a repeated sequence wins the round, reports it once after 300 ms and grows the sequence by one', () => {
        const onRoundWon = play();
        const first = watch();
        repeat(first);
        expect(playMatch).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Round:', { exact: false }).textContent).toContain('Round: 1');
        expect(onRoundWon).not.toHaveBeenCalled();
        wait(300);
        expect(onRoundWon).toHaveBeenCalledTimes(1);
        wait(500);
        const second = watch();
        expect(second).toHaveLength(2);
        expect(second[0]).toBe(first[0]);
    });

    it('a correct click that is not the last one waits for the next', () => {
        play();
        repeat(watch());
        wait(1000);
        const sequence = watch();
        fireEvent.click(axolotl(sequence[0]));
        expect(playMatch).toHaveBeenCalledTimes(1);
        expect(playMismatch).not.toHaveBeenCalled();
        expect(screen.getByText('Your turn!')).toBeTruthy();
    });

    it('at difficulty 7 every round is a brand new sequence one longer', () => {
        play(7);
        repeat(watch());
        wait(1000);
        expect(watch()).toHaveLength(2);
    });

    it('a wrong axolotl ends the game and offers a retry', () => {
        const onRoundWon = play();
        const [color] = watch();
        fireEvent.click(axolotl(other(color)));
        expect(playMismatch).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Your turn!')).toBeNull();
        expect(screen.queryByText('Retry')).toBeNull();
        wait(2000);
        expect(onRoundWon).not.toHaveBeenCalled();
    });

    it('after a lost game the score is shown and Retry starts again from round 0', () => {
        play();
        repeat(watch());
        wait(1000);
        const [color] = watch();
        fireEvent.click(axolotl(other(color)));
        expect(screen.getByText('Game Over! Rounds: 1')).toBeTruthy();
        fireEvent.click(screen.getByText('Retry'));
        expect(screen.getByText('Round:', { exact: false }).textContent).toContain('Round: 0');
        expect(screen.getByText('Watch!')).toBeTruthy();
        expect(watch()).toHaveLength(1);
    });
});
