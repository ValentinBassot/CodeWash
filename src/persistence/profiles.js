import { getDefaultStats } from '../utils/achievementUtils';
import { NEW_GAME_SUMMARY, buildSkills, parseProfileSave, summarizeSkills } from './profileSave';
import { backupCorruptedSave, readBorder, readProfileSave } from './profileStorage';

const DEFAULT_THEME = 'minecraft';

export const loadProfile = (storage, profileId) => {
    const border = readBorder(storage, profileId);
    try {
        const save = parseProfileSave(readProfileSave(storage, profileId));
        return { skills: buildSkills(save.skills), theme: save.theme, stats: save.stats, border };
    } catch (error) {
        console.error('Saved profile unreadable, a backup was kept:', error);
        backupCorruptedSave(storage, profileId, readProfileSave(storage, profileId));
        return {
            skills: buildSkills({}),
            theme: DEFAULT_THEME,
            stats: getDefaultStats(),
            border,
            problem: 'corrupted',
        };
    }
};

export const summarizeSavedProfile = (storage, profileId) => {
    const saved = readProfileSave(storage, profileId);
    if (!saved) return { ...NEW_GAME_SUMMARY, skills: {} };
    try {
        const save = parseProfileSave(saved);
        return { ...summarizeSkills(save.skills), skills: save.skills, theme: save.theme };
    } catch (error) {
        console.warn('Failed to parse profile stats:', error);
        return null;
    }
};
