import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import { WRITING_DIFFICULTY_POOLS } from './constants/gameData';
import { nextRandomValues, playWith, pressCard, save, skill, typeInto, useGameClock, wait } from './test/game';

const writing = () => skill('writing');
const allWords = Object.values(WRITING_DIFFICULTY_POOLS).flat();

const startWritingBattle = () => pressCard('Craft!');
const wordInput = () => document.querySelector('input[type="text"][maxlength]:not([inputmode])');
const expectedWord = () => {
    const shown = document.querySelector('img.w-24.h-24.animate-bob').getAttribute('src');
    const item = allWords.find((w) => w.imagePath === shown);
    return item.displayName.toUpperCase();
};
const spellRight = () => typeInto(wordInput(), expectedWord());
const spellWrong = () => {
    typeInto(wordInput(), 'Q'.repeat(expectedWord().replace(/\s/g, '').length));
    wait(600);
};

beforeEach(useGameClock);

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('writing battle', () => {
    it('shows a picture to spell, with one input box per letter', () => {
        render(<App />);
        startWritingBattle();
        expect(expectedWord()).toMatch(/^[A-Z ]+$/);
        expect(wordInput().maxLength).toBe(expectedWord().replace(/\s/g, '').length);
    });

    it('a correctly spelled word deals 12 damage and gives 20 XP', () => {
        render(<App />);
        startWritingBattle();
        spellRight();
        expect(writing()).toMatchObject({ level: 1, xp: 20, mobHealth: 48 });
    });

    it('accepts lower case and ignores spaces', () => {
        render(<App />);
        startWritingBattle();
        typeInto(wordInput(), ` ${expectedWord().toLowerCase()} `.replace(/\s/g, ' '));
        expect(writing().mobHealth).toBe(48);
    });

    it('five correct words defeat the mob and level up', () => {
        render(<App />);
        startWritingBattle();
        for (let hit = 0; hit < 5; hit++) spellRight();
        expect(writing()).toMatchObject({ level: 2, xp: 0, mobHealth: 60 });
        expect(save().stats.totalMobsDefeated).toBe(1);
    });

    it('a two-word item leaves a gap between the words and is spelled without the space', () => {
        playWith((s) => {
            Object.assign(s.skills.writing, { difficulty: 4, mobHealth: 1620, mobMaxHealth: 1620 });
        });
        nextRandomValues(3.5 / WRITING_DIFFICULTY_POOLS[4].length);
        startWritingBattle();
        expect(expectedWord()).toBe('IRON GOLEM');
        expect(wordInput().maxLength).toBe(9);

        typeInto(wordInput(), 'IRONGOLEM');
        expect(writing()).toMatchObject({ mobHealth: 1620 - 324, mobMaxHealth: 1620 });
    });

    it('a wrong word costs a heart like in math: ten of them kill the player', () => {
        render(<App />);
        startWritingBattle();
        for (let miss = 0; miss < 9; miss++) spellWrong();
        expect(save().stats.totalDeaths).toBe(0);
        spellWrong();
        expect(save().stats.totalDeaths).toBe(1);
        expect(writing()).toMatchObject({ level: 1, mobHealth: 60 });
    });

    it('a wrong word against a boss heals the boss instead of hurting the player', () => {
        playWith((s) => {
            s.skills.writing.level = 20;
        });
        startWritingBattle();
        spellRight();
        expect(writing().mobHealth).toBe(48);
        spellWrong();
        expect(writing().mobHealth).toBe(60);
        expect(save().stats.totalDeaths).toBe(0);
    });
});
