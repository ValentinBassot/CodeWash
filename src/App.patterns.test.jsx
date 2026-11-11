import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { BASE_ASSETS } from './constants/gameData';
import { playWith, pressCard, save, skill, useGameClock, wait } from './test/game';

const COLORS = Object.keys(BASE_ASSETS.axolotls);
const patterns = () => skill('patterns');
const startPatterns = () => pressCard('Solve!');
const axolotl = (color) => screen.getByText(color, { selector: 'span' }).parentElement;
const shownAxolotls = () => COLORS.filter((c) => screen.queryByText(c, { selector: 'span' }));

const litAxolotl = () =>
    [...document.querySelectorAll('.ring-yellow-400')].map((e) => e.textContent).find((t) => COLORS.includes(t)) ??
    null;
const nextTimer = () => act(() => vi.advanceTimersToNextTimer());

const watchSequence = () => {
    for (let n = 0; n < 500 && !screen.queryByText('Watch!'); n++) nextTimer();
    const seen = [];
    let previous = null;
    for (let n = 0; n < 2000 && !screen.queryByText('Your turn!'); n++) {
        nextTimer();
        const color = litAxolotl();
        if (color && color !== previous) seen.push(color);
        previous = color;
    }
    return seen;
};
const repeat = (sequence) => sequence.forEach((color) => fireEvent.click(axolotl(color)));
const playRound = () => {
    repeat(watchSequence());
    wait(300);
};

beforeEach(useGameClock);

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('patterns (Simon says with axolotls)', () => {
    it('difficulty 1 uses two axolotls and starts by showing a sequence of one', () => {
        render(<App />);
        startPatterns();
        expect(shownAxolotls()).toEqual(['Pink', 'Cyan']);
        expect(screen.getByText('Watch!')).toBeTruthy();
        expect(watchSequence()).toHaveLength(1);
        expect(screen.getByText('Your turn!')).toBeTruthy();
    });

    it('difficulty 7 uses all eight axolotls', () => {
        playWith((s) => {
            s.skills.patterns.difficulty = 7;
        });
        startPatterns();
        expect(shownAxolotls()).toEqual(COLORS);
    });

    it('each repeated sequence grows by one axolotl', () => {
        render(<App />);
        startPatterns();
        const first = watchSequence();
        repeat(first);
        wait(300);
        const second = watchSequence();
        expect(second).toHaveLength(2);
        expect(second[0]).toBe(first[0]);
    });

    it('every round deals the damage of the difficulty, like the other games: 12 at difficulty 1', () => {
        render(<App />);
        startPatterns();
        playRound();
        expect(patterns()).toMatchObject({ mobHealth: 48, xp: 20 });
        playRound();
        expect(patterns()).toMatchObject({ mobHealth: 36, xp: 40 });
    });

    it('at difficulty 2, a round deals 36 damage to a 180 HP mob', () => {
        playWith((s) => {
            Object.assign(s.skills.patterns, { difficulty: 2, mobHealth: 180, mobMaxHealth: 180 });
        });
        startPatterns();
        playRound();
        expect(patterns()).toMatchObject({ mobHealth: 144, mobMaxHealth: 180 });
    });

    it('five rounds defeat the mob', () => {
        render(<App />);
        startPatterns();
        for (let round = 0; round < 5; round++) playRound();
        expect(patterns()).toMatchObject({ level: 2, xp: 0, mobHealth: 60 });
        expect(save().stats.totalMobsDefeated).toBe(1);
    });

    it('clicks during the sequence are ignored', () => {
        render(<App />);
        startPatterns();
        fireEvent.click(axolotl('Pink'));
        fireEvent.click(axolotl('Cyan'));
        expect(screen.queryByText(/Game Over/)).toBeNull();
        expect(watchSequence()).toHaveLength(1);
    });

    it('a wrong axolotl ends the game at no cost, Retry starts again from round 0', () => {
        render(<App />);
        startPatterns();
        playRound();
        const [expected] = watchSequence();
        fireEvent.click(axolotl(expected === 'Pink' ? 'Cyan' : 'Pink'));

        expect(screen.getByText('Game Over! Rounds: 1')).toBeTruthy();
        expect(save().stats.totalDeaths).toBe(0);
        expect(patterns().mobHealth).toBe(48);

        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(screen.getByText(/Round: 0/)).toBeTruthy();
    });
});
