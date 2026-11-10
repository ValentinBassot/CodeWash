export const SAVE_KEYS = {
    currentProfile: 'currentProfile_v1',
    profileNames: 'heroProfileNames_v1',
    parentStatus: 'heroParentStatus_v1',
    legacySkills: 'heroSkills_v23',
    profileSave: (profileId) => `heroSkills_v23_p${profileId}`,
    borderEffect: (profileId) => `borderEffect_p${profileId}`,
    borderColor: (profileId) => `borderColor_p${profileId}`,
    phantomLastSpawn: 'phantomEvent_lastSpawn_v1',
};

export const readProfileSave = (storage, profileId) => {
    const own = storage.getItem(SAVE_KEYS.profileSave(profileId));
    if (!own && profileId === 1) return storage.getItem(SAVE_KEYS.legacySkills);
    return own;
};

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const readObject = (storage, key, fallback) => {
    const raw = storage.getItem(key);
    if (raw === null) return { ...fallback };
    try {
        const parsed = JSON.parse(raw);
        return isPlainObject(parsed) ? parsed : { ...fallback };
    } catch {
        return { ...fallback };
    }
};

export const DEFAULT_PROFILE_NAMES = { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
export const DEFAULT_PARENT_STATUS = { 1: false, 2: false, 3: false };
