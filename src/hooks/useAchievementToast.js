import { useCallback, useEffect, useState } from 'react';
import { getNewTierAchievements, getNewlyUnlockedAchievements } from '../utils/achievementUtils';
import { playAchievement } from '../utils/soundManager';

const TOAST_DURATION_MS = 6000;

export const firstNewAchievement = (oldStats, newStats, oldSkills, newSkills) => {
    const [unlocked] = getNewlyUnlockedAchievements(oldStats, newStats, oldSkills, newSkills);
    if (unlocked) return { achievementId: unlocked, tierIndex: null };
    const [tier] = getNewTierAchievements(oldStats, newStats, oldSkills, newSkills);
    return tier ? { achievementId: tier.achievementId, tierIndex: tier.tierIndex } : null;
};

export const useAchievementToast = () => {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (toast) setTimeout(() => setToast(null), TOAST_DURATION_MS);
    }, [toast]);

    const announce = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        const achievement = firstNewAchievement(oldStats, newStats, oldSkills, newSkills);
        if (!achievement) return;
        setToast(achievement);
        playAchievement();
    }, []);

    return { toast, announce };
};
