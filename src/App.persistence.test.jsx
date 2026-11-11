import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import { SKILL_DATA } from './constants/gameData';
import { getDefaultStats } from './utils/achievementUtils';

const TODAY = '2026-11-09';
const read = (key) => JSON.parse(localStorage.getItem(key));
const saveOf = (profile) => read(`heroSkills_v23_p${profile}`);
const skillIds = SKILL_DATA.map((s) => s.id).sort();

let warn;

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`));
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const freshSave = () => {
    render(<App />);
    const save = saveOf(1);
    localStorage.clear();
    return save;
};

describe('save format of a new player', () => {
    it('writes exactly these keys', () => {
        render(<App />);
        expect(Object.keys(localStorage).sort()).toEqual([
            'borderColor_p1',
            'borderEffect_p1',
            'currentProfile_v1',
            'heroParentStatus_v1',
            'heroProfileNames_v1',
            'heroSkills_v23_p1',
        ]);
    });

    it('profiles, parental status and cosmetics have their default values', () => {
        render(<App />);
        expect(localStorage.getItem('currentProfile_v1')).toBe('1');
        expect(read('heroProfileNames_v1')).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(read('heroParentStatus_v1')).toEqual({ 1: false, 2: false, 3: false });
        expect(localStorage.getItem('borderEffect_p1')).toBe('solid');
        expect(localStorage.getItem('borderColor_p1')).toBe('#FFD700');
    });

    it('the profile save holds skills, theme and stats, with today recorded as a login day', () => {
        render(<App />);
        const save = saveOf(1);
        expect(Object.keys(save).sort()).toEqual(['skills', 'stats', 'theme']);
        expect(save.theme).toBe('minecraft');
        expect(save.stats).toEqual({ ...getDefaultStats(), loginDates: [TODAY] });
        expect(Object.keys(save.skills).sort()).toEqual(skillIds);
    });

    it('every skill starts at level 1, difficulty 1, with a full-health mob', () => {
        render(<App />);
        for (const skill of Object.values(saveOf(1).skills)) {
            expect(skill).toMatchObject({
                level: 1,
                xp: 0,
                difficulty: 1,
                earnedBadges: [],
                mobHealth: 60,
                mobMaxHealth: 60,
                lostLevel: false,
                recoveryDifficulty: null,
            });
        }
    });

    it('a skill record has exactly these fields', () => {
        render(<App />);
        expect(Object.keys(saveOf(1).skills.reading).sort()).toEqual(
            [
                'level',
                'xp',
                'currentMob',
                'difficulty',
                'earnedBadges',
                'mobHealth',
                'mobMaxHealth',
                'lostLevel',
                'recoveryDifficulty',
                'memoryMob',
                'patternMob',
                'currentMiniboss',
                'currentBoss',
                'readingMob',
                'mathMob',
                'writingMob',
                'readingMobAura',
                'mathMobAura',
                'writingMobAura',
                'patternMobAura',
                'currentMinibossAura',
                'currentBossAura',
            ].sort(),
        );
    });
});

describe('loading an existing save', () => {
    it('keeps levels, theme and stats exactly as saved', () => {
        const save = freshSave();
        save.skills.reading = { ...save.skills.reading, level: 7, xp: 30, difficulty: 2, earnedBadges: [1] };
        save.theme = 'kpop';
        save.stats = { ...save.stats, themeChanges: 3, totalMobsDefeated: 12 };
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify(save));

        render(<App />);

        expect(saveOf(1)).toEqual(save);
    });

    it('opens the profile stored in currentProfile_v1 and writes to its own keys', () => {
        localStorage.setItem('currentProfile_v1', '2');
        localStorage.setItem('borderEffect_p2', 'rainbow');

        render(<App />);

        expect(saveOf(2)).not.toBeNull();
        expect(localStorage.getItem('heroSkills_v23_p1')).toBeNull();
        expect(localStorage.getItem('borderEffect_p2')).toBe('rainbow');
    });

    it('migrates the legacy heroSkills_v23 key and the old unwrapped format into profile 1, filling missing fields', () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ math: { level: 5, xp: 10 } }));

        render(<App />);

        expect(saveOf(1).skills.math).toMatchObject({
            level: 5,
            xp: 10,
            difficulty: 1,
            earnedBadges: [],
            mobHealth: 60,
            lostLevel: false,
            recoveryDifficulty: null,
        });
        expect(saveOf(1).skills.math.mathMob).toEqual(expect.any(String));
        expect(localStorage.getItem('heroSkills_v23')).not.toBeNull();
    });
});

describe('corrupted profile entries (D14)', () => {
    it.each([
        ['heroProfileNames_v1', '{oops', { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' }],
        ['heroProfileNames_v1', '"just text"', { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' }],
        ['heroParentStatus_v1', '{oops', { 1: false, 2: false, 3: false }],
        ['heroParentStatus_v1', 'null', { 1: false, 2: false, 3: false }],
    ])('%s = %s: the game starts with the defaults and repairs the entry', (key, value, defaults) => {
        localStorage.setItem(key, value);

        render(<App />);

        expect(read(key)).toEqual(defaults);
        expect(saveOf(1).skills.reading.level).toBe(1);
    });

    it.each(['abc', '7', '0', ''])('currentProfile_v1 = "%s": the game opens profile 1', (value) => {
        localStorage.setItem('currentProfile_v1', value);

        render(<App />);

        expect(localStorage.getItem('currentProfile_v1')).toBe('1');
        expect(Object.keys(localStorage).filter((key) => key.startsWith('heroSkills_v23_p'))).toEqual([
            'heroSkills_v23_p1',
        ]);
    });

    it('a corrupted entry does not erase the progress saved elsewhere', () => {
        const save = freshSave();
        save.skills.math.level = 9;
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify(save));
        localStorage.setItem('heroProfileNames_v1', '{oops');

        render(<App />);

        expect(saveOf(1).skills.math.level).toBe(9);
    });
});

describe('known debt', () => {
    it('an old save without mob health gets a mob matching its difficulty', () => {
        localStorage.setItem(
            'heroSkills_v23_p1',
            JSON.stringify({ skills: { writing: { level: 30, difficulty: 2 } } }),
        );

        render(<App />);

        expect(saveOf(1).skills.writing).toMatchObject({ difficulty: 2, mobHealth: 180, mobMaxHealth: 180 });
    });

    it('a saved mob health is kept as it is', () => {
        localStorage.setItem(
            'heroSkills_v23_p1',
            JSON.stringify({ skills: { writing: { level: 30, difficulty: 2, mobHealth: 100, mobMaxHealth: 180 } } }),
        );

        render(<App />);

        expect(saveOf(1).skills.writing).toMatchObject({ mobHealth: 100, mobMaxHealth: 180 });
    });

    it('KNOWN DEBT D28: a corrupted skills save is silently replaced by a new game', () => {
        localStorage.setItem('heroSkills_v23_p1', '{oops');

        render(<App />);

        expect(saveOf(1).skills.reading.level).toBe(1);
        expect(warn).toHaveBeenCalledWith('Failed to parse saved skills:', expect.any(SyntaxError));
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('a new player starts without any warning', () => {
        render(<App />);

        expect(warn).not.toHaveBeenCalled();
    });
});
