export const SAVE_KEYS = {
    currentProfile: 'currentProfile_v1',
    profileNames: 'heroProfileNames_v1',
    parentStatus: 'heroParentStatus_v1',
    legacySkills: 'heroSkills_v23',
    profileSave: (profileId) => `heroSkills_v23_p${profileId}`,
    borderEffect: (profileId) => `borderEffect_p${profileId}`,
    borderColor: (profileId) => `borderColor_p${profileId}`,
};

export const readProfileSave = (storage, profileId) => {
    const own = storage.getItem(SAVE_KEYS.profileSave(profileId));
    if (!own && profileId === 1) return storage.getItem(SAVE_KEYS.legacySkills);
    return own;
};
