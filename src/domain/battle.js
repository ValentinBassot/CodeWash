import {
    MAX_DIFFICULTY,
    calculateDamage,
    calculateMobHealth,
    calculateXPReward,
    calculateXPToLevel,
    getEncounterType,
    getRandomBoss,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomMob,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import { addUniqueToArray } from '../utils/achievementUtils';

const BOSS_EVERY = 20;
const LAST_BADGE_TIER = 7;
const STABLE_MOB_FIELDS = {
    patterns: ['patternMob', 'patternMobAura'],
    reading: ['readingMob', 'readingMobAura'],
    math: ['mathMob', 'mathMobAura'],
    writing: ['writingMob', 'writingMobAura'],
};

export const describeHit = (skillId, skill) => {
    const damage = calculateDamage(skill.level, skill.difficulty || 1);
    const isMiniboss = getEncounterType(skill.level) === 'miniboss' && skillId !== 'cleaning';
    const isInstantDefeat = skillId === 'cleaning' || skillId === 'memory' || isMiniboss;
    const dealt = isInstantDefeat ? skill.mobHealth : damage;
    return { damage, dealt, isInstantDefeat, defeatsMob: skill.mobHealth - dealt <= 0 };
};

const defeatedMob = (skill) => {
    const encounterType = getEncounterType(skill.level);
    if (encounterType === 'boss') return { encounterType, name: skill.currentBoss };
    if (encounterType === 'miniboss') return { encounterType, name: skill.currentMiniboss };
    return { encounterType, name: skill.currentMob };
};

const drawNextStableMobs = (skillId, skill) => {
    const next = {};
    if (skillId === 'memory') next.memoryMob = getRandomFriendlyMob();
    if (STABLE_MOB_FIELDS[skillId]) {
        const [mobField, auraField] = STABLE_MOB_FIELDS[skillId];
        next[mobField] = getRandomMob(skillId === 'patterns' ? skill.currentMob : skill[mobField]);
        next[auraField] = getRandomAura();
    }
    const encounterType = getEncounterType(skill.level);
    if (encounterType === 'miniboss') {
        next.currentMiniboss = getRandomMiniboss();
        next.currentMinibossAura = getRandomAura();
    }
    if (encounterType === 'boss') {
        next.currentBoss = getRandomBoss();
        next.currentBossAura = getRandomAura();
    }
    return next;
};

const passBosses = (skillId, fromLevel, toLevel, difficulty, earnedBadges) => {
    const badges = [...earnedBadges];
    const newBadgeLevels = [];
    let newDifficulty = difficulty;
    if (skillId === 'cleaning') return { difficulty: newDifficulty, badges, newBadgeLevels };
    for (let level = fromLevel; level < toLevel; level++) {
        if (level % BOSS_EVERY !== 0 || level <= 0) continue;
        const tier = Math.floor(level / BOSS_EVERY);
        if (newDifficulty < MAX_DIFFICULTY) newDifficulty++;
        if (!badges.includes(tier) && tier <= LAST_BADGE_TIER) {
            badges.push(tier);
            newBadgeLevels.push(level);
        }
    }
    return { difficulty: newDifficulty, badges, newBadgeLevels };
};

export const resolveHit = (skillId, skill) => {
    const difficulty = skill.difficulty || 1;
    const { damage, dealt, isInstantDefeat } = describeHit(skillId, skill);
    const totalXp = calculateXPReward(difficulty, skill.level);
    const effectiveDamage = isInstantDefeat ? skill.mobMaxHealth : damage;
    const xpPerHit = Math.floor(totalXp / Math.ceil(skill.mobMaxHealth / effectiveDamage));
    const mobHealth = skill.mobHealth - dealt;
    const events = { defeated: null, levelRestored: false, leveledUp: false, newBadgeLevels: [] };

    if (mobHealth > 0) {
        return {
            skill: {
                ...skill,
                xp: skill.xp + xpPerHit,
                difficulty,
                earnedBadges: [...(skill.earnedBadges || [])],
                mobHealth,
            },
            events,
        };
    }

    const hitsDealt = Math.ceil((skill.mobMaxHealth - skill.mobHealth) / effectiveDamage);
    let xp = skill.xp + totalXp - hitsDealt * xpPerHit;
    let level = skill.level;
    let currentMob = skill.currentMob;
    let newDifficulty = difficulty;
    let earnedBadges = [...(skill.earnedBadges || [])];
    let { lostLevel, recoveryDifficulty } = skill;

    events.defeated = defeatedMob(skill);
    const stableMobs = drawNextStableMobs(skillId, skill);

    if (lostLevel) {
        level += 1;
        lostLevel = false;
        recoveryDifficulty = null;
        events.levelRestored = true;
    }

    const xpToLevel = calculateXPToLevel(newDifficulty, level);
    if (xp >= xpToLevel) {
        const reached = level + Math.floor(xp / xpToLevel);
        const passed = passBosses(skillId, level, reached, newDifficulty, earnedBadges);
        newDifficulty = passed.difficulty;
        earnedBadges = passed.badges;
        events.newBadgeLevels = passed.newBadgeLevels;
        events.leveledUp = true;
        level = reached;
        xp = xp % xpToLevel;
        if (level % BOSS_EVERY !== 0 && (level - 1) % BOSS_EVERY !== 0) currentMob = getRandomMob(skill.currentMob);
    }

    if (level % BOSS_EVERY !== 0) currentMob = getRandomMob(skill.currentMob);

    return {
        skill: {
            ...skill,
            ...stableMobs,
            level,
            xp,
            currentMob,
            difficulty: newDifficulty,
            earnedBadges,
            mobHealth: calculateMobHealth(newDifficulty),
            mobMaxHealth: calculateMobHealth(newDifficulty),
            lostLevel,
            recoveryDifficulty,
        },
        events,
    };
};

const DEFEAT_COUNTERS = {
    boss: ['totalBossesDefeated', 'uniqueBossesDefeated'],
    miniboss: ['totalMinibossesDefeated', 'uniqueMinibossesDefeated'],
    hostile: ['totalMobsDefeated', 'uniqueMobsDefeated'],
};

export const recordDefeat = (stats, defeated) => {
    const [total, unique] = DEFEAT_COUNTERS[defeated.encounterType];
    return {
        ...stats,
        battlesThisSession: (stats.battlesThisSession || 0) + 1,
        [total]: (stats[total] || 0) + 1,
        [unique]: addUniqueToArray(stats[unique] || [], defeated.name),
    };
};
