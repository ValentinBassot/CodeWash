import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useProfiles } from './useProfiles';
import { createSeededRandom, resetRandomSource, setRandomSource } from '../domain/random';

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
const saveOf = (storage, profile) => JSON.parse(storage.data[`heroSkills_v23_p${profile}`]);
const savedProfile = (level, theme, deaths) =>
    JSON.stringify({ skills: { math: { level } }, theme, stats: { totalDeaths: deaths } });

beforeEach(() => setRandomSource(createSeededRandom(4)));
afterEach(() => resetRandomSource());

describe('useProfiles', () => {
    it('opens profile 1 with a new game and saves it at once', () => {
        const storage = memoryStorage();
        const { result } = renderHook(() => useProfiles(storage));
        expect(result.current).toMatchObject({
            currentProfile: 1,
            activeTheme: 'minecraft',
            selectedBorder: 'solid',
            borderColor: '#FFD700',
        });
        expect(Object.keys(storage.data).sort()).toEqual([
            'borderColor_p1',
            'borderEffect_p1',
            'currentProfile_v1',
            'heroParentStatus_v1',
            'heroProfileNames_v1',
            'heroSkills_v23_p1',
        ]);
        expect(saveOf(storage, 1).skills.math.level).toBe(1);
    });

    it('opens the saved current profile with its own save', () => {
        const storage = memoryStorage({ currentProfile_v1: '2', heroSkills_v23_p2: savedProfile(9, 'spy', 4) });
        const { result } = renderHook(() => useProfiles(storage));
        expect(result.current.currentProfile).toBe(2);
        expect(result.current.skills.math.level).toBe(9);
        expect(result.current.activeTheme).toBe('spy');
        expect(result.current.stats.totalDeaths).toBe(4);
    });

    it('saves every change of skills, stats, theme and border under the current profile', () => {
        const storage = memoryStorage();
        const { result } = renderHook(() => useProfiles(storage));
        act(() => {
            result.current.setSkills((skills) => ({ ...skills, math: { ...skills.math, level: 7 } }));
            result.current.setStats((stats) => ({ ...stats, totalDeaths: 2 }));
            result.current.setActiveTheme('pokemon');
            result.current.setSelectedBorder('rainbow');
            result.current.setBorderColor('#00ff00');
        });
        expect(saveOf(storage, 1)).toMatchObject({
            skills: { math: { level: 7 } },
            theme: 'pokemon',
            stats: { totalDeaths: 2 },
        });
        expect(storage.data).toMatchObject({ borderEffect_p1: 'rainbow', borderColor_p1: '#00ff00' });
    });

    it('switching loads everything of the new profile and leaves the first one untouched', () => {
        const storage = memoryStorage({
            heroSkills_v23_p1: savedProfile(5, 'spy', 1),
            heroSkills_v23_p2: savedProfile(9, 'pokemon', 4),
            borderEffect_p1: 'rainbow',
            borderEffect_p2: 'frost',
        });
        const { result } = renderHook(() => useProfiles(storage));
        act(() => result.current.switchProfile(2));

        expect(result.current).toMatchObject({ currentProfile: 2, activeTheme: 'pokemon', selectedBorder: 'frost' });
        expect(result.current.skills.math.level).toBe(9);
        expect(result.current.stats.totalDeaths).toBe(4);
        expect(storage.data.currentProfile_v1).toBe('2');
        expect(saveOf(storage, 1)).toMatchObject({ skills: { math: { level: 5 } }, theme: 'spy' });
        expect(storage.data.borderEffect_p1).toBe('rainbow');
    });

    it('switching to the current profile changes nothing', () => {
        const storage = memoryStorage();
        const { result } = renderHook(() => useProfiles(storage));
        const before = result.current.skills;
        act(() => result.current.switchProfile(1));
        expect(result.current.skills).toBe(before);
    });

    it('renames a profile and records a parent, both saved', () => {
        const storage = memoryStorage();
        const { result } = renderHook(() => useProfiles(storage));
        act(() => {
            result.current.renameProfile(2, 'Robo');
            result.current.setParentVerified(3, true);
        });
        expect(result.current.profileNames).toEqual({ 1: 'Player 1', 2: 'Robo', 3: 'Player 3' });
        expect(result.current.parentStatus).toEqual({ 1: false, 2: false, 3: true });
        expect(JSON.parse(storage.data.heroProfileNames_v1)[2]).toBe('Robo');
        expect(JSON.parse(storage.data.heroParentStatus_v1)[3]).toBe(true);
    });

    it('resetting erases the save, the name and the parent status of the current profile', () => {
        const storage = memoryStorage({
            heroProfileNames_v1: JSON.stringify({ 1: 'Robo', 2: 'Zed', 3: 'Player 3' }),
            heroParentStatus_v1: JSON.stringify({ 1: true, 2: true, 3: false }),
        });
        const { result } = renderHook(() => useProfiles(storage));
        act(() => result.current.resetCurrentProfile());
        expect(storage.data.heroSkills_v23_p1).toBeUndefined();
        expect(JSON.parse(storage.data.heroProfileNames_v1)).toEqual({ 1: 'Player 1', 2: 'Zed', 3: 'Player 3' });
        expect(JSON.parse(storage.data.heroParentStatus_v1)).toEqual({ 1: false, 2: true, 3: false });
    });

    it('reports a corrupted save of the opening profile until it is dismissed', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useProfiles(memoryStorage({ heroSkills_v23_p1: '{oops' })));
        expect(result.current.saveProblem).toBe('corrupted');

        act(() => result.current.dismissSaveProblem());
        expect(result.current.saveProblem).toBeNull();
    });

    it('reports a corrupted save of the profile switched to, and none for a readable one', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const storage = memoryStorage({
            heroSkills_v23_p2: '{oops',
            heroSkills_v23_p3: savedProfile(3, 'minecraft', 0),
        });
        const { result } = renderHook(() => useProfiles(storage));
        expect(result.current.saveProblem).toBeNull();

        act(() => result.current.switchProfile(2));
        expect(result.current.saveProblem).toBe('corrupted');

        act(() => result.current.switchProfile(3));
        expect(result.current.saveProblem).toBeNull();
    });
});
