import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSkills, createNewSkill, summarizeSkills } from './profileSave';
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
