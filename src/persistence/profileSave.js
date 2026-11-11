import { SKILL_DATA } from '../constants/gameData';
import {
    calculateMobHealth,
    getRandomBoss,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomMob,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import { getDefaultStats } from '../utils/achievementUtils';

const ENCOUNTERLESS_SKILLS = ['cleaning', 'memory'];

export const createNewSkill = (skillId) => ({
    level: 1,
    xp: 0,
    currentMob: getRandomMob(null),
    difficulty: 1,
    earnedBadges: [],
    mobHealth: calculateMobHealth(1),
    mobMaxHealth: calculateMobHealth(1),
    lostLevel: false,
    recoveryDifficulty: null,
    memoryMob: skillId === 'memory' ? getRandomFriendlyMob() : null,
    patternMob: skillId === 'patterns' ? getRandomMob(null) : null,
    currentMiniboss: getRandomMiniboss(),
    currentBoss: getRandomBoss(),
    readingMob: skillId === 'reading' ? getRandomMob(null) : null,
    mathMob: skillId === 'math' ? getRandomMob(null) : null,
    writingMob: skillId === 'writing' ? getRandomMob(null) : null,
    readingMobAura: skillId === 'reading' ? getRandomAura() : null,
    mathMobAura: skillId === 'math' ? getRandomAura() : null,
    writingMobAura: skillId === 'writing' ? getRandomAura() : null,
    patternMobAura: skillId === 'patterns' ? getRandomAura() : null,
    currentMinibossAura: getRandomAura(),
    currentBossAura: getRandomAura(),
});

const fillMissing = (skill, field, draw) => {
    if (!skill[field]) skill[field] = draw();
};

const restoreSkill = (skillId, fresh, saved) => {
    const skill = { ...fresh, ...saved };
    if (typeof skill.difficulty !== 'number') skill.difficulty = 1;
    if (!Array.isArray(skill.earnedBadges)) skill.earnedBadges = [];
    if (typeof saved.mobHealth !== 'number') {
        skill.mobHealth = calculateMobHealth(skill.difficulty || 1);
        skill.mobMaxHealth = calculateMobHealth(skill.difficulty || 1);
    }
    if (typeof skill.lostLevel !== 'boolean') skill.lostLevel = false;
    if (skill.recoveryDifficulty === undefined) skill.recoveryDifficulty = null;
    if (skillId === 'memory') fillMissing(skill, 'memoryMob', getRandomFriendlyMob);
    if (skillId === 'patterns') fillMissing(skill, 'patternMob', () => getRandomMob(null));
    if (skillId === 'reading') fillMissing(skill, 'readingMob', () => getRandomMob(null));
    if (skillId === 'math') fillMissing(skill, 'mathMob', () => getRandomMob(null));
    if (skillId === 'writing') fillMissing(skill, 'writingMob', () => getRandomMob(null));
    if (skillId === 'reading') fillMissing(skill, 'readingMobAura', getRandomAura);
    if (skillId === 'math') fillMissing(skill, 'mathMobAura', getRandomAura);
    if (skillId === 'writing') fillMissing(skill, 'writingMobAura', getRandomAura);
    if (skillId === 'patterns') fillMissing(skill, 'patternMobAura', getRandomAura);
    if (!ENCOUNTERLESS_SKILLS.includes(skillId)) {
        fillMissing(skill, 'currentMiniboss', getRandomMiniboss);
        fillMissing(skill, 'currentBoss', getRandomBoss);
        fillMissing(skill, 'currentMinibossAura', getRandomAura);
        fillMissing(skill, 'currentBossAura', getRandomAura);
    }
    return skill;
};

export const buildSkills = (savedSkills) => {
    const skills = {};
    SKILL_DATA.forEach((skill) => {
        skills[skill.id] = createNewSkill(skill.id);
    });
    Object.keys(savedSkills).forEach((skillId) => {
        skills[skillId] = restoreSkill(skillId, skills[skillId], savedSkills[skillId]);
    });
    return skills;
};

export const summarizeSkills = (skills) => {
    let totalLevel = 0;
    let highestLevel = 0;
    Object.values(skills).forEach((skill) => {
        if (skill && typeof skill.level === 'number') {
            totalLevel += skill.level;
            if (skill.level > highestLevel) highestLevel = skill.level;
        }
    });
    return { totalLevel, highestLevel };
};

export const parseProfileSave = (raw) => {
    if (!raw) return { skills: {}, theme: 'minecraft', stats: getDefaultStats() };
    const data = JSON.parse(raw);
    return {
        skills: data.skills || data,
        theme: data.theme || 'minecraft',
        stats: data.stats ? { ...getDefaultStats(), ...data.stats } : getDefaultStats(),
    };
};
