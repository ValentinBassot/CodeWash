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

const PROFILE_IDS = [1, 2, 3];

export const readCurrentProfile = (storage) => {
    const saved = parseInt(storage.getItem(SAVE_KEYS.currentProfile), 10);
    return PROFILE_IDS.includes(saved) ? saved : 1;
};

const DEFAULT_BORDER = { effect: 'solid', color: '#FFD700' };

export const readBorder = (storage, profileId) => ({
    effect: storage.getItem(SAVE_KEYS.borderEffect(profileId)) || DEFAULT_BORDER.effect,
    color: storage.getItem(SAVE_KEYS.borderColor(profileId)) || DEFAULT_BORDER.color,
});

export const writeBorder = (storage, profileId, border) => {
    storage.setItem(SAVE_KEYS.borderEffect(profileId), border.effect);
    storage.setItem(SAVE_KEYS.borderColor(profileId), border.color);
};

export const readProfileNames = (storage) => readObject(storage, SAVE_KEYS.profileNames, DEFAULT_PROFILE_NAMES);

export const readParentStatus = (storage) => readObject(storage, SAVE_KEYS.parentStatus, DEFAULT_PARENT_STATUS);

export const writeProfileSave = (storage, profileId, save) => {
    storage.setItem(SAVE_KEYS.profileSave(profileId), JSON.stringify(save));
};

export const writeProfiles = (storage, { currentProfile, profileNames, parentStatus }) => {
    storage.setItem(SAVE_KEYS.currentProfile, currentProfile);
    storage.setItem(SAVE_KEYS.profileNames, JSON.stringify(profileNames));
    storage.setItem(SAVE_KEYS.parentStatus, JSON.stringify(parentStatus));
};

export const resetProfile = (storage, profileId) => {
    storage.removeItem(SAVE_KEYS.profileSave(profileId));
    if (profileId === 1) storage.removeItem(SAVE_KEYS.legacySkills);
    storage.setItem(
        SAVE_KEYS.parentStatus,
        JSON.stringify({ ...readParentStatus(storage), [profileId]: DEFAULT_PARENT_STATUS[profileId] }),
    );
    storage.setItem(
        SAVE_KEYS.profileNames,
        JSON.stringify({ ...readProfileNames(storage), [profileId]: DEFAULT_PROFILE_NAMES[profileId] }),
    );
};

export const readPhantomLastSpawn = (storage) => parseInt(storage.getItem(SAVE_KEYS.phantomLastSpawn) || '0', 10);

export const writePhantomLastSpawn = (storage, time) => {
    storage.setItem(SAVE_KEYS.phantomLastSpawn, time.toString());
};

export const browserStorage = globalThis.localStorage;
