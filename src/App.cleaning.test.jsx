import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { playWith, pressCard, save, showCard, skill, typeInto, useGameClock } from './test/game';

const cleaning = () => skill('cleaning');
const startCleaning = () => {
    showCard('Organize!');
    fireEvent.click(screen.getAllByRole('button', { name: 'Organize!' })[0]);
};
const answerParentalCheck = (text) => {
    fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
    const form = screen.getByRole('button', { name: 'Submit' }).closest('form');
    typeInto(form.querySelector('input'), text);
    fireEvent.submit(form);
};

beforeEach(useGameClock);

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('cleaning (chest management)', () => {
    it('Complete! asks a parental check before counting the task', () => {
        render(<App />);
        startCleaning();
        fireEvent.click(screen.getByRole('button', { name: 'Complete!' }));
        expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
        expect(cleaning().level).toBe(1);
    });

    it('a wrong parental answer is refused and nothing is counted', () => {
        render(<App />);
        startCleaning();
        answerParentalCheck('NOPE');
        expect(screen.getByText('Incorrect answer. Try again!')).toBeTruthy();
        expect(cleaning()).toMatchObject({ level: 1, xp: 0 });
    });

    it('KNOWN DEBT D41: the fixed answer FLOPPY DISK opens the chest in one go: one level, one mob defeated', () => {
        render(<App />);
        startCleaning();
        answerParentalCheck('floppy disk');
        expect(cleaning()).toMatchObject({ level: 2, xp: 0, mobHealth: 60 });
        expect(save().stats.totalMobsDefeated).toBe(1);
    });

    it('cleaning never raises its difficulty nor awards a badge, even past level 20', () => {
        playWith((s) => {
            s.skills.cleaning.level = 20;
        });
        startCleaning();
        answerParentalCheck('FLOPPYDISK');
        expect(cleaning()).toMatchObject({ level: 21, difficulty: 1, earnedBadges: [] });
    });
});

describe('manual success button', () => {
    it('KNOWN DEBT D45: in a reading battle, "Skip / Manual Success" wins without reading anything', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<App />);
        pressCard('Enchant!');
        for (let hit = 0; hit < 5; hit++)
            fireEvent.click(screen.getByRole('button', { name: 'Skip / Manual Success' }));
        expect(skill('reading')).toMatchObject({ level: 2 });
    });
});
