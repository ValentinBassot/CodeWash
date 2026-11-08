import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import { WRITING_DIFFICULTY_POOLS } from './constants/gameData';
import { pressCard, save, skill, typeInto, useGameClock, wait } from './test/game';

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

    it('KNOWN DEBT D23: a wrong word never costs a heart, ten of them do not kill the player', () => {
        render(<App />);
        startWritingBattle();
        for (let miss = 0; miss < 10; miss++) spellWrong();
        expect(save().stats.totalDeaths).toBe(0);
        expect(writing()).toMatchObject({ level: 1, mobHealth: 60 });
    });
});
