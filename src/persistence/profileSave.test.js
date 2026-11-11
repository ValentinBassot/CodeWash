import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSkills, createNewSkill, parseProfileSave, summarizeSkills } from './profileSave';
import { getDefaultStats } from '../utils/achievementUtils';
import { SKILL_DATA } from '../constants/gameData';
import { createSeededRandom, resetRandomSource, setRandomSource } from '../domain/random';

beforeEach(() => setRandomSource(createSeededRandom(3)));
afterEach(() => resetRandomSource());

const STARTING = {
    level: 1,
    xp: 0,
    difficulty: 1,
    earnedBadges: [],
    mobHealth: 60,
    mobMaxHealth: 60,
    lostLevel: false,
    recoveryDifficulty: null,
};

describe('createNewSkill', () => {
    it('starts at level 1 with a full-health difficulty-1 mob', () => {
        expect(createNewSkill('math')).toMatchObject(STARTING);
    });

    it('draws the stable mob and aura of its own game only', () => {
        const math = createNewSkill('math');
        expect(math.mathMob).toEqual(expect.any(String));
        expect(math.mathMobAura).toEqual(expect.any(String));
        expect(math).toMatchObject({ readingMob: null, writingMob: null, memoryMob: null, patternMob: null });
        expect(createNewSkill('memory').memoryMob).toEqual(expect.any(String));
        expect(createNewSkill('patterns').patternMobAura).toEqual(expect.any(String));
    });

    it('always has a miniboss and a boss ready, with their auras', () => {
        expect(createNewSkill('cleaning')).toMatchObject({
            currentMiniboss: expect.any(String),
            currentBoss: expect.any(String),
            currentMinibossAura: expect.any(String),
            currentBossAura: expect.any(String),
        });
    });
});

describe('buildSkills', () => {
    it('creates every skill of the game when nothing is saved', () => {
        const skills = buildSkills({});
        expect(Object.keys(skills)).toEqual(SKILL_DATA.map((s) => s.id));
        for (const skill of Object.values(skills)) expect(skill).toMatchObject(STARTING);
    });

    it('keeps what is saved and fills what an old save is missing', () => {
        const { math } = buildSkills({ math: { level: 5, xp: 10 } });
        expect(math).toMatchObject({ ...STARTING, level: 5, xp: 10 });
        expect(math.mathMob).toEqual(expect.any(String));
        expect(math.mathMobAura).toEqual(expect.any(String));
    });

    it('rebuilds the mob health of an old save from its difficulty, keeps a saved one', () => {
        expect(buildSkills({ writing: { difficulty: 2 } }).writing).toMatchObject({
            mobHealth: 180,
            mobMaxHealth: 180,
        });
        expect(buildSkills({ writing: { difficulty: 2, mobHealth: 100, mobMaxHealth: 180 } }).writing).toMatchObject({
            mobHealth: 100,
            mobMaxHealth: 180,
        });
    });

    it('repairs a missing difficulty, badge list or death state', () => {
        expect(
            buildSkills({
                reading: { difficulty: 'x', earnedBadges: 'x', lostLevel: 'x', recoveryDifficulty: undefined },
            }).reading,
        ).toMatchObject({ difficulty: 1, earnedBadges: [], lostLevel: false, recoveryDifficulty: null });
    });

    it.each([
        [0, 1],
        [-3, 1],
        [8, 7],
        [99, 7],
        [2.6, 2],
    ])('brings a saved difficulty of %s back to %s, with a mob of that difficulty', (saved, kept) => {
        const health = 60 * 3 ** (kept - 1);
        expect(buildSkills({ math: { difficulty: saved, mobHealth: 5, mobMaxHealth: 5 } }).math).toMatchObject({
            difficulty: kept,
            mobHealth: health,
            mobMaxHealth: health,
        });
    });

    it.each([
        [0, 1],
        [-4, 1],
        ['x', 1],
        [null, 1],
        [3.9, 3],
    ])('brings a saved level of %s back to %s', (saved, kept) => {
        expect(buildSkills({ math: { level: saved } }).math.level).toBe(kept);
    });

    it('keeps a valid level and difficulty untouched', () => {
        expect(buildSkills({ math: { level: 140, difficulty: 7 } }).math).toMatchObject({ level: 140, difficulty: 7 });
    });

    it('keeps the saved mob health of a save without difficulty', () => {
        expect(buildSkills({ math: { mobHealth: 30, mobMaxHealth: 60 } }).math).toMatchObject({
            difficulty: 1,
            mobHealth: 30,
            mobMaxHealth: 60,
        });
    });

    it('refills a cleared miniboss or boss for battle skills, not for cleaning and memory', () => {
        const cleared = { currentMiniboss: null, currentBoss: null, currentMinibossAura: null, currentBossAura: null };
        const skills = buildSkills({ math: { ...cleared }, cleaning: { ...cleared }, memory: { ...cleared } });
        expect(skills.math.currentMiniboss).toEqual(expect.any(String));
        expect(skills.math.currentBossAura).toEqual(expect.any(String));
        expect(skills.cleaning).toMatchObject(cleared);
        expect(skills.memory).toMatchObject(cleared);
    });

    it('keeps a saved entry that is not a skill of the game', () => {
        expect(buildSkills({ ghost: { level: 3 } }).ghost.level).toBe(3);
    });
});

describe('summarizeSkills', () => {
    it('adds up the levels and finds the highest, ignoring entries without a level', () => {
        expect(summarizeSkills({ a: { level: 3 }, b: { level: 5 }, c: null, d: { level: 'x' } })).toEqual({
            totalLevel: 8,
            highestLevel: 5,
        });
        expect(summarizeSkills({})).toEqual({ totalLevel: 0, highestLevel: 0 });
    });
});

describe('parseProfileSave', () => {
    it('gives an empty save for a missing entry', () => {
        expect(parseProfileSave(null)).toEqual({ skills: {}, theme: 'minecraft', stats: getDefaultStats() });
        expect(parseProfileSave('')).toEqual({ skills: {}, theme: 'minecraft', stats: getDefaultStats() });
    });

    it('reads skills, theme and stats, completing the stats with their defaults', () => {
        const raw = JSON.stringify({ skills: { math: { level: 4 } }, theme: 'spy', stats: { totalDeaths: 2 } });
        expect(parseProfileSave(raw)).toEqual({
            skills: { math: { level: 4 } },
            theme: 'spy',
            stats: { ...getDefaultStats(), totalDeaths: 2 },
        });
    });

    it('reads the old format where the skills are the whole entry', () => {
        expect(parseProfileSave(JSON.stringify({ math: { level: 4 } }))).toEqual({
            skills: { math: { level: 4 } },
            theme: 'minecraft',
            stats: getDefaultStats(),
        });
    });

    it('throws on a corrupted entry', () => {
        expect(() => parseProfileSave('{oops')).toThrow(SyntaxError);
        expect(() => parseProfileSave('null')).toThrow(TypeError);
    });
});
