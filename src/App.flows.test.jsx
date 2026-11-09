import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { save, typeInto, useGameClock } from './test/game';

const read = (key) => JSON.parse(localStorage.getItem(key));
const topButton = (icon) => document.querySelector(`button > svg.lucide-${icon}`).closest('button');
const openSettings = () => fireEvent.click(topButton('settings'));
const openCosmetics = () => fireEvent.click(topButton('sparkles'));
const themeButton = (name) => screen.getByAltText(name).closest('button');
const profileCard = (name) => screen.getByText(`${name},`);
const submitForm = (submitLabel, text) => {
    const form = screen.getByRole('button', { name: submitLabel }).closest('form');
    typeInto(form.querySelector('input'), text);
    fireEvent.submit(form);
};

beforeEach(() => {
    useGameClock();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('themes', () => {
    it('picking another theme saves it and counts one theme change', () => {
        render(<App />);
        openCosmetics();
        fireEvent.click(themeButton('Pokemon'));
        expect(save().theme).toBe('pokemon');
        expect(save().stats.themeChanges).toBe(1);
    });

    it('the active theme cannot be picked again', () => {
        render(<App />);
        openCosmetics();
        expect(themeButton('Minecraft').disabled).toBe(true);
        fireEvent.click(themeButton('Minecraft'));
        expect(save().stats.themeChanges).toBe(0);
    });
});

describe('profiles', () => {
    it('switching profile opens a fresh save and keeps the first one', () => {
        render(<App />);
        openSettings();
        fireEvent.click(profileCard('Player 2'));

        expect(localStorage.getItem('currentProfile_v1')).toBe('2');
        expect(read('heroSkills_v23_p2').skills.reading.level).toBe(1);
        expect(read('heroSkills_v23_p1')).not.toBeNull();
    });

    it('the current profile can be renamed', () => {
        render(<App />);
        openSettings();
        fireEvent.click(document.querySelector('svg.lucide-pencil'));
        const input = screen.getByDisplayValue('Player 1');
        typeInto(input, 'Robo');
        fireEvent.click(input.nextElementSibling);

        expect(read('heroProfileNames_v1')).toEqual({ 1: 'Robo', 2: 'Player 2', 3: 'Player 3' });
    });
});

describe('parent mode', () => {
    it('after the parental check, every skill jumps to level 200, difficulty 7, with all badges', () => {
        render(<App />);
        openSettings();
        fireEvent.click(screen.getAllByRole('checkbox')[0]);
        submitForm('Submit', 'FLOPPY DISK');

        expect(read('heroParentStatus_v1')).toEqual({ 1: true, 2: false, 3: false });
        for (const s of Object.values(save().skills)) {
            expect(s).toMatchObject({ level: 200, difficulty: 7, earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8] });
        }
    });
});

describe('reset', () => {
    it('refuses anything but DELETE', () => {
        render(<App />);
        openSettings();
        fireEvent.click(screen.getByRole('button', { name: /DELETE PROFILE PROGRESS/ }));
        submitForm('Delete', 'DELET');
        expect(screen.getByText('Please type DELETE to confirm.')).toBeTruthy();
        expect(read('heroSkills_v23_p1')).not.toBeNull();
    });

    it('DELETE erases the profile save, its name and its parent status, then reloads', () => {
        localStorage.setItem('heroProfileNames_v1', JSON.stringify({ 1: 'Robo', 2: 'Player 2', 3: 'Player 3' }));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify({ 1: true, 2: false, 3: false }));
        localStorage.setItem('heroSkills_v23', JSON.stringify({ math: { level: 9 } }));
        render(<App />);
        openSettings();
        fireEvent.click(screen.getByRole('button', { name: /DELETE PROFILE PROGRESS/ }));
        submitForm('Delete', 'DELETE');

        expect(localStorage.getItem('heroSkills_v23_p1')).toBeNull();
        expect(localStorage.getItem('heroSkills_v23')).toBeNull();
        expect(read('heroProfileNames_v1')[1]).toBe('Player 1');
        expect(read('heroParentStatus_v1')[1]).toBe(false);
    });
});
