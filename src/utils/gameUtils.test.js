import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    calculateDamage,
    calculateMobHealth,
    calculateXPReward,
    calculateXPToLevel,
    generateMathProblem,
    getDifficultyMultiplier,
    getEncounterType,
    getExpectedDifficulty,
    getMobForSkill,
    getReadingWord,
    getWordForDifficulty,
} from './gameUtils';
import {
    BOSS_MOBS,
    CHEST_BLOCKS,
    FRIENDLY_MOBS,
    FUNNY_LONG_WORDS,
    HOSTILE_MOBS,
    MINIBOSS_MOBS,
    READING_WORDS,
    SPECIAL_CHESTS,
} from '../constants/gameData';

const rollRandom = (...values) => {
    const spy = vi.spyOn(Math, 'random');
    values.forEach((v) => spy.mockReturnValueOnce(v));
    return spy;
};

afterEach(() => vi.restoreAllMocks());

describe('encounter cycle', () => {
    it.each([
        [1, 'hostile'],
        [9, 'hostile'],
        [10, 'miniboss'],
        [11, 'hostile'],
        [20, 'boss'],
        [21, 'hostile'],
        [30, 'miniboss'],
        [40, 'boss'],
    ])('level %i is a %s fight', (level, type) => {
        expect(getEncounterType(level)).toBe(type);
    });
});

describe('mob chosen for a skill', () => {
    const standardChests = Object.keys(CHEST_BLOCKS).filter((k) => !SPECIAL_CHESTS.includes(k));

    it('cleaning: Ender Chest every 20 levels, Shulker Box every 5, standard chests in order otherwise', () => {
        const cleaning = { id: 'cleaning' };
        expect(getMobForSkill(cleaning, { level: 20 })).toBe('Ender Chest');
        expect(getMobForSkill(cleaning, { level: 15 })).toBe('Shulker Box');
        expect(getMobForSkill(cleaning, { level: 1 })).toBe(standardChests[0]);
        expect(getMobForSkill(cleaning, { level: 2 })).toBe(standardChests[1]);
    });

    it('picks a new random mob when none is stored yet', () => {
        rollRandom(0);
        expect(getMobForSkill({ id: 'patterns' }, { level: 3 })).toBe(Object.keys(HOSTILE_MOBS)[0]);
        rollRandom(0);
        expect(getMobForSkill({ id: 'memory' }, { level: 3 })).toBe(Object.keys(FRIENDLY_MOBS)[0]);
        rollRandom(0);
        expect(getMobForSkill({ id: 'math' }, { level: 20 })).toBe(Object.keys(BOSS_MOBS)[0]);
        rollRandom(0);
        expect(getMobForSkill({ id: 'math' }, { level: 10 })).toBe(Object.keys(MINIBOSS_MOBS)[0]);
    });

    it('any other skill keeps a valid current mob, or draws a hostile one', () => {
        const zombie = Object.keys(HOSTILE_MOBS)[0];
        expect(getMobForSkill({ id: 'other' }, { level: 3, currentMob: zombie })).toBe(zombie);
        rollRandom(0);
        expect(getMobForSkill({ id: 'other' }, { level: 3, currentMob: 'Not a mob' })).toBe(zombie);
    });

    it('keeps the stored mob so it does not change on re-render', () => {
        expect(getMobForSkill({ id: 'memory' }, { level: 3, memoryMob: 'Allay' })).toBe('Allay');
        expect(getMobForSkill({ id: 'math' }, { level: 3, mathMob: 'Creeper' })).toBe('Creeper');
        expect(getMobForSkill({ id: 'reading' }, { level: 20, currentBoss: 'Wither' })).toBe('Wither');
        expect(getMobForSkill({ id: 'writing' }, { level: 10, currentMiniboss: 'Evoker' })).toBe('Evoker');
    });
});

describe('combat numbers', () => {
    it.each([
        [1, 1, 12, 60],
        [2, 3, 36, 180],
        [3, 9, 108, 540],
        [7, 729, 8748, 43740],
    ])('difficulty %i: multiplier %i, damage %i, mob health %i (always 5 hits)', (difficulty, mult, damage, health) => {
        expect(getDifficultyMultiplier(difficulty)).toBe(mult);
        expect(calculateDamage(99, difficulty)).toBe(damage);
        expect(calculateMobHealth(difficulty)).toBe(health);
    });

    it.each([
        [1, 1],
        [20, 1],
        [21, 2],
        [121, 7],
        [500, 7],
    ])('player level %i expects difficulty %i', (level, difficulty) => {
        expect(getExpectedDifficulty(level)).toBe(difficulty);
    });
});

describe('experience', () => {
    it('one kill at the expected difficulty gives exactly one level', () => {
        for (const level of [1, 5, 20, 21, 60, 140]) {
            const difficulty = getExpectedDifficulty(level);
            expect(calculateXPReward(difficulty, level)).toBe(calculateXPToLevel(difficulty, level));
        }
    });

    it('pins known values', () => {
        expect(calculateXPReward(1, 1)).toBe(100);
        expect(calculateXPReward(2, 21)).toBe(596);
        expect(calculateXPToLevel(1, 21)).toBe(596);
    });

    it('playing below the expected difficulty multiplies the reward by 0.3 per level of gap', () => {
        expect(calculateXPReward(1, 21)).toBe(59);
        expect(calculateXPReward(1, 41)).toBe(35);
    });

    it('without a player level, uses the old formula', () => {
        expect(calculateXPReward(2)).toBe(300);
        expect(calculateXPToLevel(3)).toBe(900);
    });
});

describe('reading words', () => {
    it('difficulty 1 picks a 3-letter word', () => {
        rollRandom(0);
        expect(getReadingWord(1)).toBe(READING_WORDS[3][0]);
    });

    it('difficulty 7 picks a funny long word', () => {
        rollRandom(0);
        expect(getReadingWord(7)).toBe(FUNNY_LONG_WORDS[0]);
    });

    it('an unknown difficulty falls back to 3-letter words', () => {
        rollRandom(0);
        expect(getReadingWord(42)).toBe(READING_WORDS[3][0]);
    });
});

describe('math problems', () => {
    it('difficulty 1 is an addition', () => {
        rollRandom(0, 0.5, 0.5);
        expect(generateMathProblem(1)).toEqual({ type: 'math', question: '5 + 5 = ?', answer: '10' });
    });

    it('difficulty 5 can ask a division with a whole result', () => {
        rollRandom(0.99, 0.5, 0.5);
        const problem = generateMathProblem(5);
        expect(problem.question).toMatch(/÷/);
        const [a, b] = problem.question.match(/\d+/g).map(Number);
        expect(a / b).toBe(Number(problem.answer));
    });

    it('difficulty 6 asks an order-of-operations problem', () => {
        rollRandom(0);
        expect(generateMathProblem(6)).toEqual({
            type: 'math',
            question: '3 + 4 × 2 = ?',
            answer: '11',
            isPemdas: true,
        });
    });

    it('difficulty 7 asks a nightmare problem', () => {
        rollRandom(0);
        expect(generateMathProblem(7)).toMatchObject({ answer: '32', isNightmare: true });
    });

    it('subtraction from 0 asks 0 - 0, never a negative result', () => {
        rollRandom(0.5, 0, 0);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '0 - 0 = ?', answer: '0' });
    });

    it('subtraction keeps taking away at least 1 from a positive number', () => {
        rollRandom(0.5, 0.5, 0);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '10 - 1 = ?', answer: '9' });
    });

    it('no subtraction of difficulties 3 to 5 has a negative answer', () => {
        for (const difficulty of [3, 4, 5]) {
            for (let draw = 0; draw < 2000; draw++) {
                expect(Number(generateMathProblem(difficulty).answer)).toBeGreaterThanOrEqual(0);
            }
        }
    });
});

describe('writing words', () => {
    it('returns the word in upper case with its picture', () => {
        rollRandom(0);
        const item = getWordForDifficulty(1);
        expect(item.word).toBe(item.word.toUpperCase());
        expect(item).toHaveProperty('displayName');
        expect(item).toHaveProperty('image');
    });

    it('difficulties above 5 share the pool of difficulty 5', () => {
        rollRandom(0, 0);
        expect(getWordForDifficulty(7)).toEqual(getWordForDifficulty(5));
    });
});
