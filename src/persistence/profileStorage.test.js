import { describe, expect, it } from 'vitest';
import {
    MAX_STORED_TICKETS,
    SAVE_KEYS,
    addTicket,
    clearGithubToken,
    readBorder,
    readCurrentProfile,
    readObject,
    readGithubToken,
    readParentStatus,
    readPhantomLastSpawn,
    readProfileNames,
    readProfileSave,
    readSaveFiles,
    readTickets,
    resetProfile,
    updateTicket,
    writeBorder,
    writeGithubToken,
    writePhantomLastSpawn,
    writeProfileSave,
    writeProfiles,
} from './profileStorage';

const memoryStorage = (entries = {}) => {
    const data = { ...entries };
    return {
        data,
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = String(value);
        },
        removeItem: (key) => {
            delete data[key];
        },
    };
};

const storageWith = (entries) => ({ getItem: (key) => (key in entries ? entries[key] : null) });

describe('SAVE_KEYS', () => {
    it('names every key of the save format', () => {
        expect(SAVE_KEYS.currentProfile).toBe('currentProfile_v1');
        expect(SAVE_KEYS.profileNames).toBe('heroProfileNames_v1');
        expect(SAVE_KEYS.parentStatus).toBe('heroParentStatus_v1');
        expect(SAVE_KEYS.legacySkills).toBe('heroSkills_v23');
        expect(SAVE_KEYS.profileSave(2)).toBe('heroSkills_v23_p2');
        expect(SAVE_KEYS.borderEffect(3)).toBe('borderEffect_p3');
        expect(SAVE_KEYS.borderColor(1)).toBe('borderColor_p1');
        expect(SAVE_KEYS.phantomLastSpawn).toBe('phantomEvent_lastSpawn_v1');
        expect(SAVE_KEYS.bugTickets).toBe('bugTickets_v1');
        expect(SAVE_KEYS.githubToken).toBe('bugReportGithubToken_v1');
    });
});

describe('readProfileSave', () => {
    it('reads the save of the profile', () => {
        expect(readProfileSave(storageWith({ heroSkills_v23_p2: '{"a":1}' }), 2)).toBe('{"a":1}');
    });

    it('falls back to the legacy key for profile 1 only', () => {
        const storage = storageWith({ heroSkills_v23: 'legacy' });
        expect(readProfileSave(storage, 1)).toBe('legacy');
        expect(readProfileSave(storage, 2)).toBeNull();
    });

    it('prefers the profile save over the legacy key', () => {
        expect(readProfileSave(storageWith({ heroSkills_v23_p1: 'own', heroSkills_v23: 'legacy' }), 1)).toBe('own');
    });

    it('treats an empty profile save as missing for profile 1, and keeps it for the others', () => {
        expect(readProfileSave(storageWith({ heroSkills_v23_p1: '', heroSkills_v23: 'legacy' }), 1)).toBe('legacy');
        expect(readProfileSave(storageWith({ heroSkills_v23_p2: '' }), 2)).toBe('');
    });
});

describe('readObject', () => {
    const fallback = { 1: 'Player 1' };

    it('returns the stored object', () => {
        expect(readObject(storageWith({ k: '{"1":"Robo"}' }), 'k', fallback)).toEqual({ 1: 'Robo' });
    });

    it.each([
        ['missing', {}],
        ['not JSON', { k: '{oops' }],
        ['JSON but not an object', { k: '"text"' }],
        ['null', { k: 'null' }],
        ['an array', { k: '[1,2]' }],
    ])('returns a copy of the fallback when the entry is %s', (_, entries) => {
        const result = readObject(storageWith(entries), 'k', fallback);
        expect(result).toEqual(fallback);
        expect(result).not.toBe(fallback);
    });
});

describe('readCurrentProfile', () => {
    it.each([
        ['1', 1],
        ['2', 2],
        ['3', 3],
    ])('reads the saved profile %s', (saved, profile) => {
        expect(readCurrentProfile(storageWith({ currentProfile_v1: saved }))).toBe(profile);
    });

    it('opens profile 1 when nothing is saved', () => {
        expect(readCurrentProfile(storageWith({}))).toBe(1);
    });

    it.each(['abc', '0', '4', '-1', ''])('opens profile 1 for the invalid entry "%s"', (saved) => {
        expect(readCurrentProfile(storageWith({ currentProfile_v1: saved }))).toBe(1);
    });
});

describe('border', () => {
    it('is solid gold when nothing is saved', () => {
        expect(readBorder(memoryStorage(), 1)).toEqual({ effect: 'solid', color: '#FFD700' });
    });

    it('is written and read per profile', () => {
        const storage = memoryStorage();
        writeBorder(storage, 2, { effect: 'rainbow', color: '#ff0000' });
        expect(storage.data).toEqual({ borderEffect_p2: 'rainbow', borderColor_p2: '#ff0000' });
        expect(readBorder(storage, 2)).toEqual({ effect: 'rainbow', color: '#ff0000' });
        expect(readBorder(storage, 1)).toEqual({ effect: 'solid', color: '#FFD700' });
    });
});

describe('profile names and parent status', () => {
    it('have defaults when nothing is saved', () => {
        expect(readProfileNames(memoryStorage())).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(readParentStatus(memoryStorage())).toEqual({ 1: false, 2: false, 3: false });
    });

    it('are written with the current profile and read back', () => {
        const storage = memoryStorage();
        const profileNames = { 1: 'Robo', 2: 'Player 2', 3: 'Player 3' };
        const parentStatus = { 1: false, 2: true, 3: false };
        writeProfiles(storage, { currentProfile: 2, profileNames, parentStatus });
        expect(readCurrentProfile(storage)).toBe(2);
        expect(readProfileNames(storage)).toEqual(profileNames);
        expect(readParentStatus(storage)).toEqual(parentStatus);
    });
});

describe('writeProfileSave', () => {
    it('writes the save of the profile as JSON under its own key', () => {
        const storage = memoryStorage();
        writeProfileSave(storage, 3, { skills: {}, theme: 'spy', stats: {} });
        expect(storage.data).toEqual({ heroSkills_v23_p3: '{"skills":{},"theme":"spy","stats":{}}' });
    });
});

describe('resetProfile', () => {
    const filled = () =>
        memoryStorage({
            heroSkills_v23: 'legacy',
            heroSkills_v23_p1: 'one',
            heroSkills_v23_p2: 'two',
            heroProfileNames_v1: JSON.stringify({ 1: 'Robo', 2: 'Zed', 3: 'Player 3' }),
            heroParentStatus_v1: JSON.stringify({ 1: true, 2: true, 3: false }),
        });

    it('erases the save, name and parent status of that profile only', () => {
        const storage = filled();
        resetProfile(storage, 2);
        expect(storage.data.heroSkills_v23_p2).toBeUndefined();
        expect(storage.data.heroSkills_v23_p1).toBe('one');
        expect(storage.data.heroSkills_v23).toBe('legacy');
        expect(readProfileNames(storage)).toEqual({ 1: 'Robo', 2: 'Player 2', 3: 'Player 3' });
        expect(readParentStatus(storage)).toEqual({ 1: true, 2: false, 3: false });
    });

    it('also erases the legacy save for profile 1', () => {
        const storage = filled();
        resetProfile(storage, 1);
        expect(storage.data.heroSkills_v23_p1).toBeUndefined();
        expect(storage.data.heroSkills_v23).toBeUndefined();
        expect(storage.data.heroSkills_v23_p2).toBe('two');
    });
});

describe('phantom last spawn', () => {
    it('is 0 when never recorded, then the recorded time', () => {
        const storage = memoryStorage();
        expect(readPhantomLastSpawn(storage)).toBe(0);
        writePhantomLastSpawn(storage, 1700000000000);
        expect(storage.data).toEqual({ phantomEvent_lastSpawn_v1: '1700000000000' });
        expect(readPhantomLastSpawn(storage)).toBe(1700000000000);
    });
});

const TICKET = { title: 'T', description: 'D' };

const failingStorage = () => ({
    getItem: () => null,
    setItem: () => {
        throw new Error('quota exceeded');
    },
    removeItem: () => {},
});

describe('bug tickets', () => {
    it('are empty when nothing is saved', () => {
        expect(readTickets(memoryStorage())).toEqual([]);
    });

    it('are added with a number, a state and no issue yet', () => {
        const storage = memoryStorage();
        const first = addTicket(storage, { state: 'pending', ticket: TICKET });
        const second = addTicket(storage, { state: 'opened', ticket: TICKET });
        expect(first).toEqual({ id: 1, state: 'pending', issueUrl: null, issueNumber: null, ticket: TICKET });
        expect(second.id).toBe(2);
        expect(readTickets(storage)).toEqual([first, second]);
        expect(Object.keys(storage.data)).toEqual(['bugTickets_v1']);
    });

    it('never reuse the number of a ticket that is still there', () => {
        const storage = memoryStorage();
        addTicket(storage, { state: 'pending', ticket: TICKET });
        addTicket(storage, { state: 'pending', ticket: TICKET });
        storage.data.bugTickets_v1 = JSON.stringify(readTickets(storage).slice(1));
        expect(addTicket(storage, { state: 'pending', ticket: TICKET }).id).toBe(3);
    });

    it('keep only the most recent ones', () => {
        const storage = memoryStorage();
        for (let n = 0; n < MAX_STORED_TICKETS + 3; n++) addTicket(storage, { state: 'pending', ticket: TICKET });
        const tickets = readTickets(storage);
        expect(tickets).toHaveLength(MAX_STORED_TICKETS);
        expect(tickets[0].id).toBe(4);
        expect(tickets.at(-1).id).toBe(MAX_STORED_TICKETS + 3);
    });

    it('are updated by number, the others stay as they are', () => {
        const storage = memoryStorage();
        addTicket(storage, { state: 'pending', ticket: TICKET });
        addTicket(storage, { state: 'pending', ticket: TICKET });
        const link = { state: 'created', issueUrl: 'https://github.com/a/b/issues/5', issueNumber: 5 };
        expect(updateTicket(storage, 2, link)).toBe(true);
        const [first, second] = readTickets(storage);
        expect(first.state).toBe('pending');
        expect(second).toMatchObject({ id: 2, ...link });
    });

    it('cannot be updated when they do not exist', () => {
        const storage = memoryStorage();
        expect(updateTicket(storage, 9, { state: 'created' })).toBe(false);
        expect(storage.data).toEqual({});
    });

    it.each([
        ['not JSON', '{oops'],
        ['not a list', '{"id":1}'],
        ['null', 'null'],
    ])('are empty when the entry is %s', (_, raw) => {
        expect(readTickets(memoryStorage({ bugTickets_v1: raw }))).toEqual([]);
    });

    it('skip the records that are not tickets', () => {
        const good = { id: 1, state: 'pending', issueUrl: null, issueNumber: null, ticket: TICKET };
        const raw = JSON.stringify([
            good,
            null,
            'text',
            { id: 'x', state: 'pending', ticket: TICKET },
            { ...good, state: 'lost' },
            { ...good, ticket: 5 },
        ]);
        expect(readTickets(memoryStorage({ bugTickets_v1: raw }))).toEqual([good]);
    });

    it('are not added, without a crash, when the storage is full', () => {
        expect(addTicket(failingStorage(), { state: 'pending', ticket: TICKET })).toBeNull();
    });
});

describe('GitHub token', () => {
    it('is missing by default, then stored under its own key, then removed', () => {
        const storage = memoryStorage();
        expect(readGithubToken(storage)).toBeNull();
        writeGithubToken(storage, 'fake-token');
        expect(storage.data).toEqual({ bugReportGithubToken_v1: 'fake-token' });
        expect(readGithubToken(storage)).toBe('fake-token');
        clearGithubToken(storage);
        expect(readGithubToken(storage)).toBeNull();
        expect(storage.data).toEqual({});
    });

    it('is never part of the tickets', () => {
        const storage = memoryStorage();
        writeGithubToken(storage, 'fake-token');
        addTicket(storage, { state: 'pending', ticket: TICKET });
        expect(storage.data.bugTickets_v1).not.toContain('fake-token');
    });
});

describe('GitHub token with a storage that fails', () => {
    const brokenStorage = () => ({
        getItem: () => {
            throw new Error('blocked');
        },
        setItem: () => {
            throw new Error('quota exceeded');
        },
        removeItem: () => {
            throw new Error('blocked');
        },
    });

    it('is missing instead of crashing, and says when it could not be written or removed', () => {
        const storage = brokenStorage();
        expect(readGithubToken(storage)).toBeNull();
        expect(writeGithubToken(storage, 'fake-token')).toBe(false);
        expect(clearGithubToken(storage)).toBe(false);
    });

    it('says when it was written or removed', () => {
        const storage = memoryStorage();
        expect(writeGithubToken(storage, 'fake-token')).toBe(true);
        expect(clearGithubToken(storage)).toBe(true);
    });
});

describe('readSaveFiles', () => {
    it('reads the three profiles, the names and the current profile', () => {
        const storage = memoryStorage({
            currentProfile_v1: '2',
            heroSkills_v23_p1: '{"theme":"spy","skills":{}}',
            heroSkills_v23_p3: '{oops',
            heroProfileNames_v1: JSON.stringify({ 1: 'Robo', 2: 'Zed', 3: 'Kim' }),
        });
        expect(readSaveFiles(storage)).toEqual({
            currentProfile: 2,
            profileNames: { 1: 'Robo', 2: 'Zed', 3: 'Kim' },
            saves: { 1: { theme: 'spy', skills: {} }, 2: null, 3: '{oops' },
        });
    });

    it('keeps the text of a save that is not an object, and the legacy save of profile 1', () => {
        const storage = memoryStorage({ heroSkills_v23: '{"reading":{"level":3}}', heroSkills_v23_p2: '[1]' });
        expect(readSaveFiles(storage).saves).toEqual({ 1: { reading: { level: 3 } }, 2: '[1]', 3: null });
    });

    it('treats an empty entry as no save', () => {
        expect(readSaveFiles(memoryStorage({ heroSkills_v23_p2: '' })).saves[2]).toBeNull();
    });
});
