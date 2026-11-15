import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadProfile, summarizeSavedProfile } from './profiles';
import { getDefaultStats } from '../utils/achievementUtils';
import { SKILL_DATA } from '../constants/gameData';
import { createSeededRandom, resetRandomSource, setRandomSource } from '../domain/random';

const storageWith = (entries) => ({
    getItem: (key) => (key in entries ? entries[key] : null),
    setItem: (key, value) => {
        entries[key] = value;
    },
});
const skillIds = SKILL_DATA.map((skill) => skill.id);

let warn;

beforeEach(() => {
    setRandomSource(createSeededRandom(2));
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    resetRandomSource();
    vi.restoreAllMocks();
});

describe('loadProfile', () => {
    it('gives a new game with the default theme, stats and border when nothing is saved', () => {
        const profile = loadProfile(storageWith({}), 2);
        expect(Object.keys(profile.skills)).toEqual(skillIds);
        expect(profile.skills.math).toMatchObject({ level: 1, difficulty: 1 });
        expect(profile).toMatchObject({
            theme: 'minecraft',
            stats: getDefaultStats(),
            border: { effect: 'solid', color: '#FFD700' },
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('gives the saved skills, theme, stats and border of that profile', () => {
        const storage = storageWith({
            heroSkills_v23_p2: JSON.stringify({
                skills: { math: { level: 9 } },
                theme: 'spy',
                stats: { totalDeaths: 4 },
            }),
            borderEffect_p2: 'rainbow',
            borderColor_p2: '#ff0000',
        });
        const profile = loadProfile(storage, 2);
        expect(profile.skills.math.level).toBe(9);
        expect(profile.skills.reading.level).toBe(1);
        expect(profile).toMatchObject({
            theme: 'spy',
            stats: { ...getDefaultStats(), totalDeaths: 4 },
            border: { effect: 'rainbow', color: '#ff0000' },
        });
    });

    it('a corrupted save gives a new game flagged as corrupted, the border is kept', () => {
        const profile = loadProfile(storageWith({ heroSkills_v23_p1: '{oops', borderEffect_p1: 'rainbow' }), 1);
        expect(profile.skills.math.level).toBe(1);
        expect(profile).toMatchObject({ theme: 'minecraft', stats: getDefaultStats(), problem: 'corrupted' });
        expect(profile.border.effect).toBe('rainbow');
    });

    it('a corrupted save is kept as a backup and reported as an error', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const entries = { heroSkills_v23_p2: '{oops' };
        loadProfile(storageWith(entries), 2);
        expect(entries.heroSkills_v23_p2_corrupted).toBe('{oops');
        expect(error).toHaveBeenCalledTimes(1);
    });

    it('a readable save has no problem', () => {
        const entries = { heroSkills_v23_p1: JSON.stringify({ skills: {}, theme: 'minecraft', stats: {} }) };
        expect(loadProfile(storageWith(entries), 1).problem).toBeUndefined();
        expect(entries.heroSkills_v23_p1_corrupted).toBeUndefined();
    });
});

describe('summarizeSavedProfile', () => {
    it('gives the summary of a new game for a profile never played', () => {
        expect(summarizeSavedProfile(storageWith({}), 3)).toEqual({ totalLevel: 6, highestLevel: 1, skills: {} });
    });

    it('adds up the saved levels and gives the saved skills and theme', () => {
        const skills = { math: { level: 9 }, reading: { level: 4 } };
        const storage = storageWith({ heroSkills_v23_p2: JSON.stringify({ skills, theme: 'spy' }) });
        expect(summarizeSavedProfile(storage, 2)).toEqual({ totalLevel: 13, highestLevel: 9, skills, theme: 'spy' });
    });

    it('gives nothing for a corrupted save, with a warning', () => {
        expect(summarizeSavedProfile(storageWith({ heroSkills_v23_p1: '{oops' }), 1)).toBeNull();
        expect(warn).toHaveBeenCalledWith('Failed to parse profile stats:', expect.any(SyntaxError));
    });
});
