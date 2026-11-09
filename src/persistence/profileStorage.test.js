import { describe, expect, it } from 'vitest';
import { SAVE_KEYS, readProfileSave } from './profileStorage';

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
