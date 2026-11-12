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
    const [queue, setQueue] = useState([]);
    const toast = queue[0] || null;

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setQueue((waiting) => waiting.slice(1)), TOAST_DURATION_MS);
        return () => clearTimeout(timer);
    }, [toast]);

    const announce = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        const achievement = firstNewAchievement(oldStats, newStats, oldSkills, newSkills);
        if (!achievement) return;
        setQueue((waiting) => [...waiting, achievement]);
        playAchievement();
    }, []);

    return { toast, announce };
};
