import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { playWith, pressCard, save, skill, useGameClock, wait } from './test/game';

const memory = () => skill('memory');
const startMemory = () => pressCard('Match!');
const cards = () =>
    [...document.querySelectorAll('div.perspective-1000')].filter((d) => d.className.includes('aspect-[2/3]'));
const faceOf = (card) => card.querySelectorAll('img')[1].getAttribute('src');
const flipped = () => cards().filter((c) => c.className.includes('rotate-y-180'));
const pairs = () => {
    const byFace = new Map();
    cards().forEach((card) => byFace.set(faceOf(card), [...(byFace.get(faceOf(card)) || []), card]));
    return [...byFace.values()];
};
const flip = (card) => fireEvent.click(card);
const matchPair = ([a, b]) => {
    flip(a);
    flip(b);
    wait(300);
};
const mismatch = () => {
    const [first, second] = pairs();
    flip(first[0]);
    flip(second[0]);
    wait(300);
    wait(500);
};

beforeEach(useGameClock);

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('memory (match and hatch)', () => {
    it('difficulty 1 deals 3 pairs of friendly mobs, face down', () => {
        render(<App />);
        startMemory();
        expect(cards()).toHaveLength(6);
        expect(pairs().map((p) => p.length)).toEqual([2, 2, 2]);
        expect(flipped()).toHaveLength(0);
    });

    it('a matched pair disappears from the board', () => {
        render(<App />);
        startMemory();
        matchPair(pairs()[0]);
        expect(cards()).toHaveLength(4);
    });

    it('a mismatch flips both cards back and costs nothing', () => {
        render(<App />);
        startMemory();
        mismatch();
        expect(cards()).toHaveLength(6);
        expect(flipped()).toHaveLength(0);
        expect(save().stats.totalDeaths).toBe(0);
    });

    it('clicking the same card twice does not count as a pair', () => {
        render(<App />);
        startMemory();
        const [card] = cards();
        flip(card);
        flip(card);
        wait(800);
        expect(flipped()).toHaveLength(1);
        expect(cards()).toHaveLength(6);
    });

    it('matching every pair hatches the creature: one level, one mob defeated, the board closes', () => {
        render(<App />);
        startMemory();
        for (const pair of pairs()) matchPair(pair);
        wait(500);

        expect(memory()).toMatchObject({ level: 2, xp: 0 });
        expect(save().stats.totalMobsDefeated).toBe(1);
        expect(cards()).toHaveLength(0);
        expect(screen.getByRole('button', { name: 'Match!' })).toBeTruthy();
    });

    it('difficulty 7 deals 10 pairs', () => {
        playWith((s) => {
            s.skills.memory.difficulty = 7;
        });
        startMemory();
        expect(cards()).toHaveLength(20);
    });
});

describe('perfect memory game (D62)', () => {
    const winGame = () => {
        while (cards().length > 0) matchPair(pairs()[0]);
        wait(500);
    };

    it('a game won without any mismatch counts as perfect', () => {
        render(<App />);
        startMemory();
        winGame();
        expect(memory().level).toBe(2);
        expect(save().stats.perfectMemoryGames).toBe(1);
    });

    it('a game won after a mismatch does not', () => {
        render(<App />);
        startMemory();
        mismatch();
        winGame();
        expect(memory().level).toBe(2);
        expect(save().stats.perfectMemoryGames).toBe(0);
    });
});
