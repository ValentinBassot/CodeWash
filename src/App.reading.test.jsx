import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { READING_WORDS } from './constants/gameData';
import { pressCard, save, skill, useGameClock, wait } from './test/game';

class FakeRecognition {
    static instances = [];
    constructor() {
        this.starts = 0;
        this.stops = 0;
        FakeRecognition.instances.push(this);
    }
    start() {
        this.starts += 1;
        this.onstart?.();
    }
    stop() {
        this.stops += 1;
        this.onend?.();
    }
    hear(text) {
        act(() => this.onresult({ results: [[{ transcript: text }]] }));
    }
    endOnItsOwn() {
        act(() => this.onend());
    }
}

const reading = () => skill('reading');
const recognition = () => FakeRecognition.instances.at(-1);
const startReadingBattle = () => pressCard('Enchant!');
const shownWord = () =>
    [...document.querySelectorAll('span')].map((s) => s.textContent).find((t) => READING_WORDS[3].includes(t));
const micButton = () => {
    const wordBox = [...document.querySelectorAll('span')].find((x) =>
        READING_WORDS[3].includes(x.textContent),
    ).parentElement;
    return wordBox.nextElementSibling;
};

beforeEach(() => {
    useGameClock();
    FakeRecognition.instances = [];
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('reading battle without speech recognition', () => {
    it('shows a 3-letter word and says the microphone is not available', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<App />);
        startReadingBattle();
        expect(shownWord()).toMatch(/^[A-Z]{3}$/);
        fireEvent.click(micButton());
        expect(screen.getByText('Mic not available')).toBeTruthy();
    });
});

describe('reading battle with speech recognition', () => {
    beforeEach(() => {
        vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('starts listening in English as soon as the battle starts', () => {
        render(<App />);
        startReadingBattle();
        expect(FakeRecognition.instances).toHaveLength(1);
        expect(recognition()).toMatchObject({ lang: 'en-US', continuous: true, starts: 1 });
        expect(screen.getByText('Listening...')).toBeTruthy();
    });

    it('saying the word deals 12 damage, whatever the case and punctuation', () => {
        render(<App />);
        startReadingBattle();
        recognition().hear(`${shownWord().toLowerCase()}.`);
        expect(reading()).toMatchObject({ xp: 20, mobHealth: 48 });
    });

    it('five words read aloud defeat the mob', () => {
        render(<App />);
        startReadingBattle();
        for (let hit = 0; hit < 5; hit++) recognition().hear(shownWord());
        expect(reading()).toMatchObject({ level: 2, xp: 0, mobHealth: 60 });
    });

    it('a wrong word costs a heart: ten of them kill the player', () => {
        render(<App />);
        startReadingBattle();
        for (let miss = 0; miss < 10; miss++) recognition().hear('WRONGWORD');
        expect(save().stats.totalDeaths).toBe(1);
    });

    it('a single letter is treated as noise: ten of them cost nothing', () => {
        render(<App />);
        startReadingBattle();
        for (let noise = 0; noise < 10; noise++) recognition().hear('a');
        expect(save().stats.totalDeaths).toBe(0);
        expect(reading().mobHealth).toBe(60);
    });

    it('pressing the microphone while listening stops it', () => {
        render(<App />);
        startReadingBattle();
        expect(screen.queryAllByText('Mic Off')).toHaveLength(0);
        fireEvent.click(micButton());
        expect(recognition().stops).toBe(1);
        expect(screen.getAllByText('Mic Off').length).toBeGreaterThan(0);
        wait(500);
        expect(FakeRecognition.instances).toHaveLength(1);
    });

    it('when the browser ends the session during the battle, listening starts again', () => {
        render(<App />);
        startReadingBattle();
        recognition().endOnItsOwn();
        wait(500);

        expect(FakeRecognition.instances).toHaveLength(2);
        expect(recognition().starts).toBe(1);
        expect(screen.getByText('Listening...')).toBeTruthy();
    });

    it('after a restart, the word read aloud still counts', () => {
        render(<App />);
        startReadingBattle();
        recognition().endOnItsOwn();
        wait(500);
        recognition().hear(shownWord());

        expect(reading().mobHealth).toBe(48);
    });

    it('the microphone button starts listening again after it was stopped', () => {
        render(<App />);
        startReadingBattle();
        fireEvent.click(micButton());
        fireEvent.click(micButton());

        expect(FakeRecognition.instances).toHaveLength(2);
        expect(recognition().starts).toBe(1);
    });
});
