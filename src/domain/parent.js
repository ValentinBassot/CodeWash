import { calculateMobHealth } from '../utils/gameUtils';

export const PARENT_LEVEL = 200;
export const PARENT_DIFFICULTY = 7;
export const PARENT_BADGES = [1, 2, 3, 4, 5, 6, 7, 8];

export const grantParentPrivileges = (skills) =>
    Object.fromEntries(
        Object.entries(skills).map(([skillId, skill]) => [
            skillId,
            {
                ...skill,
                level: PARENT_LEVEL,
                difficulty: PARENT_DIFFICULTY,
                earnedBadges: [...PARENT_BADGES],
                mobHealth: calculateMobHealth(PARENT_DIFFICULTY),
                mobMaxHealth: calculateMobHealth(PARENT_DIFFICULTY),
            },
        ]),
    );
