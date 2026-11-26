import { TICKET_STATES } from '../domain/ticket';

export const SAVE_KEYS = {
    currentProfile: 'currentProfile_v1',
    profileNames: 'heroProfileNames_v1',
    parentStatus: 'heroParentStatus_v1',
    legacySkills: 'heroSkills_v23',
    profileSave: (profileId) => `heroSkills_v23_p${profileId}`,
    corruptedBackup: (profileId) => `heroSkills_v23_p${profileId}_corrupted`,
    borderEffect: (profileId) => `borderEffect_p${profileId}`,
    borderColor: (profileId) => `borderColor_p${profileId}`,
    phantomLastSpawn: 'phantomEvent_lastSpawn_v1',
    bugTickets: 'bugTickets_v1',
    githubToken: 'bugReportGithubToken_v1',
};

export const readProfileSave = (storage, profileId) => {
    const own = storage.getItem(SAVE_KEYS.profileSave(profileId));
    if (!own && profileId === 1) return storage.getItem(SAVE_KEYS.legacySkills);
    return own;
};

export const backupCorruptedSave = (storage, profileId, raw) => {
    storage.setItem(SAVE_KEYS.corruptedBackup(profileId), raw);
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

export const MAX_STORED_TICKETS = 20;

const isTicketRecord = (value) =>
    isPlainObject(value) &&
    Number.isInteger(value.id) &&
    TICKET_STATES.includes(value.state) &&
    isPlainObject(value.ticket);

export const readTickets = (storage) => {
    try {
        const parsed = JSON.parse(storage.getItem(SAVE_KEYS.bugTickets));
        return Array.isArray(parsed) ? parsed.filter(isTicketRecord) : [];
    } catch {
        return [];
    }
};

const writeTickets = (storage, tickets) => {
    try {
        storage.setItem(SAVE_KEYS.bugTickets, JSON.stringify(tickets.slice(-MAX_STORED_TICKETS)));
        return true;
    } catch {
        return false;
    }
};

export const addTicket = (storage, { state, ticket }) => {
    const tickets = readTickets(storage);
    const id = tickets.reduce((highest, record) => Math.max(highest, record.id), 0) + 1;
    const record = { id, state, issueUrl: null, issueNumber: null, ticket };
    return writeTickets(storage, [...tickets, record]) ? record : null;
};

export const updateTicket = (storage, id, changes) => {
    const tickets = readTickets(storage);
    if (!tickets.some((record) => record.id === id)) return false;
    return writeTickets(
        storage,
        tickets.map((record) => (record.id === id ? { ...record, ...changes } : record)),
    );
};

export const readGithubToken = (storage) => {
    try {
        return storage.getItem(SAVE_KEYS.githubToken) || null;
    } catch {
        return null;
    }
};

export const writeGithubToken = (storage, token) => {
    try {
        storage.setItem(SAVE_KEYS.githubToken, token);
        return true;
    } catch {
        return false;
    }
};

export const clearGithubToken = (storage) => {
    try {
        storage.removeItem(SAVE_KEYS.githubToken);
        return true;
    } catch {
        return false;
    }
};

const readableSave = (raw) => {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return isPlainObject(parsed) ? parsed : raw;
    } catch {
        return raw;
    }
};

export const readSaveFiles = (storage) => ({
    currentProfile: readCurrentProfile(storage),
    profileNames: readProfileNames(storage),
    saves: Object.fromEntries(PROFILE_IDS.map((id) => [id, readableSave(readProfileSave(storage, id))])),
});

export const browserStorage = globalThis.localStorage;
