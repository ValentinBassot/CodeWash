import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    addUniqueToArray,
    getAchievementDisplayName,
    getCurrentTier,
    getDefaultStats,
    getNewTierAchievements,
    getNewlyUnlockedAchievements,
    getNextTier,
    getTierProgress,
    isAchievementUnlocked,
    recordLoginDate,
} from './achievementUtils';
import { ACHIEVEMENTS, getAchievementsByCategory, getAllAchievements } from '../constants/achievements';
import { BOSS_MOBS, HOSTILE_MOBS, MINIBOSS_MOBS } from '../constants/gameData';

const skillsAt = (...levels) => Object.fromEntries(levels.map((level, i) => [`s${i}`, { level }]));
const sixSkillsAt = (level) => skillsAt(level, level, level, level, level, level);
const stats = (overrides = {}) => ({ ...getDefaultStats(), ...overrides });

afterEach(() => vi.useRealTimers());

describe('default stats', () => {
    it('start at zero with empty lists', () => {
        expect(getDefaultStats()).toEqual({
            phantomsCaught: 0,
            totalMobsDefeated: 0,
            totalBossesDefeated: 0,
            totalMinibossesDefeated: 0,
            totalDeaths: 0,
            uniqueMobsDefeated: [],
            uniqueBossesDefeated: [],
            uniqueMinibossesDefeated: [],
            themeChanges: 0,
            borderChanges: 0,
            battlesThisSession: 0,
            loginDates: [],
            perfectMemoryGames: 0,
            achievementsUnlocked: [],
        });
    });

    it('nothing is unlocked for a new player', () => {
        const unlocked = Object.keys(ACHIEVEMENTS).filter((id) => isAchievementUnlocked(id, stats(), sixSkillsAt(1)));
        expect(unlocked).toEqual([]);
    });
});

describe('one-time achievements', () => {
    it.each([
        ['first_steps', { totalMobsDefeated: 1 }],
        ['fashion_forward', { themeChanges: 1 }],
        ['framed', { borderChanges: 1 }],
        ['ouch', { totalDeaths: 1 }],
        ['dragon_slayer', { totalBossesDefeated: 1 }],
        ['mini_menace', { totalMinibossesDefeated: 1 }],
        ['perfectionist', { perfectMemoryGames: 1 }],
        ['speed_demon', { battlesThisSession: 10 }],
        ['dedicated', { loginDates: ['2026-11-01', '2026-11-02', '2026-11-03'] }],
    ])('%s unlocks with %o', (id, overrides) => {
        expect(isAchievementUnlocked(id, stats(), sixSkillsAt(1))).toBe(false);
        expect(isAchievementUnlocked(id, stats(overrides), sixSkillsAt(1))).toBe(true);
    });

    it('speed_demon needs 10 battles in the session, not 9', () => {
        expect(isAchievementUnlocked('speed_demon', stats({ battlesThisSession: 9 }), sixSkillsAt(1))).toBe(false);
    });

    it('skill-based achievements read the skills', () => {
        expect(isAchievementUnlocked('level_up', stats(), skillsAt(1, 2))).toBe(true);
        expect(isAchievementUnlocked('high_roller', stats(), { a: { level: 1, difficulty: 7 } })).toBe(true);
        expect(isAchievementUnlocked('badge_collector', stats(), { a: { earnedBadges: ['b1'] } })).toBe(true);
        expect(isAchievementUnlocked('full_set', stats(), { a: { earnedBadges: Array(8).fill('b') } })).toBe(true);
        expect(isAchievementUnlocked('full_set', stats(), { a: { earnedBadges: Array(7).fill('b') } })).toBe(false);
    });

    it('collection achievements need every boss, miniboss and hostile mob of the game', () => {
        expect(isAchievementUnlocked('world_ender', stats({ uniqueBossesDefeated: Object.keys(BOSS_MOBS) }), {})).toBe(
            true,
        );
        expect(
            isAchievementUnlocked('mini_master', stats({ uniqueMinibossesDefeated: Object.keys(MINIBOSS_MOBS) }), {}),
        ).toBe(true);
        expect(
            isAchievementUnlocked('monster_manual', stats({ uniqueMobsDefeated: Object.keys(HOSTILE_MOBS) }), {}),
        ).toBe(true);
        expect(isAchievementUnlocked('world_ender', stats({ uniqueBossesDefeated: ['Wither'] }), {})).toBe(false);
    });

    it('an unknown achievement is never unlocked and has no name', () => {
        expect(isAchievementUnlocked('nope', stats(), {})).toBe(false);
        expect(getAchievementDisplayName('nope', stats(), {})).toBe('');
    });
});

describe('tiered achievements', () => {
    it('a tiered achievement counts as unlocked from its first tier exactly', () => {
        expect(isAchievementUnlocked('phantom_hunter', stats({ phantomsCaught: 4 }), {})).toBe(false);
        expect(isAchievementUnlocked('phantom_hunter', stats({ phantomsCaught: 5 }), {})).toBe(true);
    });

    it('Ghost Buster tiers follow the phantoms caught', () => {
        expect(getCurrentTier('phantom_hunter', stats({ phantomsCaught: 4 }), {})).toBe(-1);
        expect(getCurrentTier('phantom_hunter', stats({ phantomsCaught: 5 }), {})).toBe(0);
        expect(getCurrentTier('phantom_hunter', stats({ phantomsCaught: 60 }), {})).toBe(5);
        expect(getCurrentTier('phantom_hunter', stats({ phantomsCaught: 100 }), {})).toBe(7);
    });

    it('Power Overwhelming adds up the levels of every skill', () => {
        expect(getCurrentTier('combined_levels', stats(), skillsAt(50, 49))).toBe(-1);
        expect(getCurrentTier('combined_levels', stats(), skillsAt(50, 50))).toBe(0);
        expect(isAchievementUnlocked('combined_levels', stats(), skillsAt(60, 40, 100))).toBe(true);
    });

    it('Jack of All Trades follows the lowest skill', () => {
        expect(getCurrentTier('skill_mastery', stats(), skillsAt(20, 20, 20, 20, 20, 19))).toBe(-1);
        expect(getCurrentTier('skill_mastery', stats(), sixSkillsAt(40))).toBe(1);
    });

    it('Jack of All Trades counts the skills that reached the level of the next tier', () => {
        const text = (skills) => ACHIEVEMENTS.skill_mastery.getProgressText(stats(), skills);
        expect(text(sixSkillsAt(40))).toBe('0/6 skills at level 60+');
        expect(text(skillsAt(60, 60, 45, 45, 45, 45))).toBe('2/6 skills at level 60+');
        expect(text(sixSkillsAt(170))).toBe('6/6 skills at level 160+');
    });

    it('with no skill at all, Jack of All Trades has no tier and no progress', () => {
        expect(getCurrentTier('skill_mastery', stats(), {})).toBe(-1);
        expect(isAchievementUnlocked('skill_mastery', stats(), {})).toBe(false);
        expect(ACHIEVEMENTS.skill_mastery.getProgressText(stats(), {})).toBe('0/0 skills at level 20+');
    });

    it('progress inside a tier is a floored percentage, 100 at the top', () => {
        expect(getTierProgress('phantom_hunter', stats({ phantomsCaught: 2 }), {})).toBe(40);
        expect(getTierProgress('phantom_hunter', stats({ phantomsCaught: 7 }), {})).toBe(40);
        expect(getTierProgress('phantom_hunter', stats({ phantomsCaught: 32 }), {})).toBe(28);
        expect(getTierProgress('phantom_hunter', stats({ phantomsCaught: 100 }), {})).toBe(100);
        expect(getTierProgress('first_steps', stats(), {})).toBe(0);
    });

    it('next tier is the following one, null at the top or for one-time achievements', () => {
        expect(getNextTier('phantom_hunter', stats({ phantomsCaught: 5 }), {})).toEqual({
            level: 10,
            tierName: 'Silver Ghost Buster',
        });
        expect(getNextTier('phantom_hunter', stats({ phantomsCaught: 100 }), {})).toBeNull();
        expect(getNextTier('first_steps', stats(), {})).toBeNull();
        expect(getCurrentTier('first_steps', stats(), {})).toBe(-1);
    });

    it('display name is the tier name once a tier is reached', () => {
        expect(getAchievementDisplayName('phantom_hunter', stats(), {})).toBe('Ghost Buster');
        expect(getAchievementDisplayName('phantom_hunter', stats({ phantomsCaught: 10 }), {})).toBe(
            'Silver Ghost Buster',
        );
        expect(getAchievementDisplayName('ouch', stats(), {})).toBe('Ouch!');
    });
});

describe('changes between two states', () => {
    it('lists the achievements unlocked by the change', () => {
        const before = stats();
        const after = stats({ totalMobsDefeated: 1, totalDeaths: 1 });
        expect(getNewlyUnlockedAchievements(before, after, sixSkillsAt(1), sixSkillsAt(1))).toEqual([
            'first_steps',
            'ouch',
        ]);
    });

    it('does not list an achievement that was already unlocked', () => {
        const before = stats({ totalMobsDefeated: 1 });
        const after = stats({ totalMobsDefeated: 2, totalDeaths: 1 });
        expect(getNewlyUnlockedAchievements(before, after, sixSkillsAt(1), sixSkillsAt(1))).toEqual(['ouch']);
    });

    it('lists the tiered achievements that moved up', () => {
        const before = stats({ phantomsCaught: 4 });
        const after = stats({ phantomsCaught: 10 });
        expect(getNewTierAchievements(before, after, sixSkillsAt(1), sixSkillsAt(1))).toEqual([
            { achievementId: 'phantom_hunter', tierIndex: 1 },
        ]);
    });
});

describe('helpers', () => {
    it('adds a value only once', () => {
        const list = ['Zombie'];
        expect(addUniqueToArray(list, 'Zombie')).toBe(list);
        expect(addUniqueToArray(list, 'Creeper')).toEqual(['Zombie', 'Creeper']);
    });

    it('records each login day once', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
        expect(recordLoginDate([])).toEqual(['2026-11-09']);
        const days = ['2026-11-09'];
        expect(recordLoginDate(days)).toBe(days);
    });

    it('records the local day: 00:30 in Paris is already the next day', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-09T23:30:00Z'));
        expect(recordLoginDate([])).toEqual(['2026-11-10']);
    });

    it('lists achievements, all or by category', () => {
        expect(getAllAchievements()).toHaveLength(Object.keys(ACHIEVEMENTS).length);
        expect(getAchievementsByCategory('progression').map((a) => a.id)).toEqual(
            expect.arrayContaining(['combined_levels', 'skill_mastery']),
        );
    });
});
