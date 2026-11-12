import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    describeHit,
    getAuraForSkill,
    getChallengeDifficulty,
    recordDefeat,
    resolveHit,
    withDifficulty,
} from './battle';
import { createNewSkill } from '../persistence/profileSave';
import { getDefaultStats } from '../utils/achievementUtils';
import { createSeededRandom, resetRandomSource, setRandomSource } from './random';

beforeEach(() => setRandomSource(createSeededRandom(5)));
afterEach(() => resetRandomSource());

const skillOf = (skillId, overrides = {}) => ({ ...createNewSkill(skillId), ...overrides });
const NO_EVENT = { defeated: null, levelRestored: false, leveledUp: false, newBadgeLevels: [] };

describe('describeHit', () => {
    it('a normal hit deals a fifth of a full-health mob', () => {
        expect(describeHit('math', skillOf('math'))).toEqual({
            damage: 12,
            dealt: 12,
            isInstantDefeat: false,
            defeatsMob: false,
        });
    });

    it('the damage follows the difficulty', () => {
        const skill = skillOf('math', { difficulty: 3, mobHealth: 540, mobMaxHealth: 540 });
        expect(describeHit('math', skill).dealt).toBe(108);
    });

    it('the last hit defeats the mob', () => {
        expect(describeHit('math', skillOf('math', { mobHealth: 12 })).defeatsMob).toBe(true);
    });

    it.each(['cleaning', 'memory'])('%s is won in one hit', (skillId) => {
        expect(describeHit(skillId, skillOf(skillId))).toMatchObject({
            dealt: 60,
            isInstantDefeat: true,
            defeatsMob: true,
        });
    });

    it('a miniboss falls in one hit, except in cleaning where level 10 is a normal chest', () => {
        expect(describeHit('math', skillOf('math', { level: 10 })).isInstantDefeat).toBe(true);
        expect(describeHit('cleaning', skillOf('cleaning', { level: 10 })).isInstantDefeat).toBe(true);
        expect(describeHit('math', skillOf('math', { level: 20 })).isInstantDefeat).toBe(false);
    });
});

describe('resolveHit', () => {
    it('a hit that does not defeat the mob removes health and gives a fifth of the XP', () => {
        const skill = skillOf('math');
        const { skill: next, events } = resolveHit('math', skill);
        expect(next).toEqual({ ...skill, mobHealth: 48, xp: 20 });
        expect(events).toEqual(NO_EVENT);
    });

    it('five hits defeat a mob, give one level and a new full-health mob', () => {
        let skill = skillOf('math');
        let events;
        for (let hit = 0; hit < 5; hit++) ({ skill, events } = resolveHit('math', skill));
        expect(skill).toMatchObject({ level: 2, xp: 0, mobHealth: 60, mobMaxHealth: 60, difficulty: 1 });
        expect(events).toEqual({
            ...NO_EVENT,
            leveledUp: true,
            defeated: { encounterType: 'hostile', name: expect.any(String) },
        });
    });

    it('reports the defeated mob, miniboss or boss by its name', () => {
        const hostile = skillOf('math', { mobHealth: 12, currentMob: 'Zombie' });
        expect(resolveHit('math', hostile).events.defeated).toEqual({ encounterType: 'hostile', name: 'Zombie' });
        const miniboss = skillOf('math', { level: 10, currentMiniboss: 'Mini' });
        expect(resolveHit('math', miniboss).events.defeated).toEqual({ encounterType: 'miniboss', name: 'Mini' });
        const boss = skillOf('math', { level: 20, mobHealth: 12, currentBoss: 'Wither' });
        expect(resolveHit('math', boss).events.defeated).toEqual({ encounterType: 'boss', name: 'Wither' });
    });

    it('defeating the level-20 boss raises the difficulty, gives badge 1 and a stronger mob', () => {
        const boss = skillOf('math', { level: 20, mobHealth: 12, mobMaxHealth: 12 });
        const { skill, events } = resolveHit('math', boss);
        expect(skill).toMatchObject({ level: 21, difficulty: 2, earnedBadges: [1], mobHealth: 180, mobMaxHealth: 180 });
        expect(events.newBadgeLevels).toEqual([20]);
    });

    it('a badge already earned is not given twice, and the difficulty stops at 7', () => {
        const boss = skillOf('math', {
            level: 140,
            difficulty: 7,
            mobHealth: 8748,
            mobMaxHealth: 8748,
            earnedBadges: [7],
        });
        const { skill, events } = resolveHit('math', boss);
        expect(skill).toMatchObject({ level: 141, difficulty: 7, earnedBadges: [7] });
        expect(events.newBadgeLevels).toEqual([]);
    });

    it('a mob beaten above the expected difficulty gives several levels, which the picker no longer allows', () => {
        const boss = skillOf('math', { level: 20, difficulty: 2, mobHealth: 36, mobMaxHealth: 36 });
        expect(resolveHit('math', boss).skill.level).toBe(23);
    });

    it('cleaning never changes difficulty and earns no badge', () => {
        const { skill, events } = resolveHit('cleaning', skillOf('cleaning', { level: 20 }));
        expect(skill).toMatchObject({ level: 21, difficulty: 1, earnedBadges: [] });
        expect(events.newBadgeLevels).toEqual([]);
    });

    it('a win after a death gives the lost level back, on top of the level earned', () => {
        const skill = skillOf('math', { level: 4, mobHealth: 12, lostLevel: true, recoveryDifficulty: 1 });
        const { skill: next, events } = resolveHit('math', skill);
        expect(next).toMatchObject({ level: 5, lostLevel: false, recoveryDifficulty: null });
        expect(events.levelRestored).toBe(true);
    });

    it('draws the next mob of the game that was won, and nothing for the other games', () => {
        const skill = skillOf('reading', { mobHealth: 12, readingMob: 'Zombie' });
        const next = resolveHit('reading', skill).skill;
        expect(next.readingMob).not.toBe('Zombie');
        expect(next).toMatchObject({ mathMob: null, writingMob: null, patternMob: null, memoryMob: null });
        expect(next.currentMiniboss).toBe(skill.currentMiniboss);
        expect(next.currentBoss).toBe(skill.currentBoss);
    });

    it('draws a new miniboss or boss only after defeating one', () => {
        const miniboss = skillOf('math', { level: 10, currentMiniboss: 'old', currentMinibossAura: 'old' });
        const afterMiniboss = resolveHit('math', miniboss).skill;
        expect(afterMiniboss.currentMiniboss).not.toBe('old');
        expect(afterMiniboss.currentMinibossAura).not.toBe('old');
        const boss = skillOf('math', { level: 20, mobHealth: 12, currentBoss: 'old', currentBossAura: 'old' });
        const afterBoss = resolveHit('math', boss).skill;
        expect(afterBoss.currentBoss).not.toBe('old');
        expect(afterBoss.currentBossAura).not.toBe('old');
    });

    it('does not modify the skill it receives', () => {
        const skill = skillOf('math', { mobHealth: 12, earnedBadges: [] });
        const copy = structuredClone(skill);
        resolveHit('math', skill);
        expect(skill).toEqual(copy);
    });
});

describe('recordDefeat', () => {
    it.each([
        ['hostile', 'totalMobsDefeated', 'uniqueMobsDefeated'],
        ['miniboss', 'totalMinibossesDefeated', 'uniqueMinibossesDefeated'],
        ['boss', 'totalBossesDefeated', 'uniqueBossesDefeated'],
    ])('a defeated %s counts in %s and %s, and in the session', (encounterType, total, unique) => {
        const stats = recordDefeat(getDefaultStats(), { encounterType, name: 'Zed' });
        expect(stats).toEqual({ ...getDefaultStats(), battlesThisSession: 1, [total]: 1, [unique]: ['Zed'] });
    });

    it('counts the same mob twice but lists it once', () => {
        const once = recordDefeat(getDefaultStats(), { encounterType: 'hostile', name: 'Zed' });
        const twice = recordDefeat(once, { encounterType: 'hostile', name: 'Zed' });
        expect(twice).toMatchObject({ totalMobsDefeated: 2, uniqueMobsDefeated: ['Zed'], battlesThisSession: 2 });
    });
});

describe('getAuraForSkill', () => {
    const skill = {
        level: 3,
        mathMobAura: 'math-aura',
        readingMobAura: 'reading-aura',
        currentMinibossAura: 'miniboss-aura',
        currentBossAura: 'boss-aura',
    };

    it('a battle skill shows the aura of its own mob', () => {
        expect(getAuraForSkill('math', skill)).toBe('math-aura');
        expect(getAuraForSkill('reading', skill)).toBe('reading-aura');
    });

    it('a miniboss or a boss shows its own aura', () => {
        expect(getAuraForSkill('math', { ...skill, level: 10 })).toBe('miniboss-aura');
        expect(getAuraForSkill('math', { ...skill, level: 20 })).toBe('boss-aura');
    });

    it('memory and cleaning never have an aura, nor a skill whose aura is missing', () => {
        expect(getAuraForSkill('memory', { ...skill, level: 20 })).toBeNull();
        expect(getAuraForSkill('cleaning', { ...skill, level: 10 })).toBeNull();
        expect(getAuraForSkill('writing', skill)).toBeNull();
    });
});

describe('withDifficulty', () => {
    it('sets the difficulty and gives a full-health mob of that difficulty', () => {
        const skill = { level: 45, difficulty: 1, mobHealth: 12, mobMaxHealth: 60 };
        expect(withDifficulty(skill, 3)).toEqual({ level: 45, difficulty: 3, mobHealth: 540, mobMaxHealth: 540 });
        expect(skill.difficulty).toBe(1);
    });
});

describe('getChallengeDifficulty', () => {
    it('is the difficulty of the skill against a mob or a boss, 1 when none is set', () => {
        expect(getChallengeDifficulty({ level: 3, difficulty: 2 })).toBe(2);
        expect(getChallengeDifficulty({ level: 20, difficulty: 2 })).toBe(2);
        expect(getChallengeDifficulty({ level: 3 })).toBe(1);
    });

    it('is one harder against a miniboss, never above 7', () => {
        expect(getChallengeDifficulty({ level: 10, difficulty: 2 })).toBe(3);
        expect(getChallengeDifficulty({ level: 130, difficulty: 7 })).toBe(7);
    });
});
