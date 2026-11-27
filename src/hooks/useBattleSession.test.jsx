import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode, useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useBattleSession } from './useBattleSession';
import { buildSkills } from '../persistence/profileSave';
import { monitor } from '../monitoring';

const flows = () => monitor.getEvents().filter((event) => event.type === 'flow');

const session = (options) =>
    renderHook(() => {
        const [skills, setSkills] = useState(() => buildSkills({}));
        const [stats, setStats] = useState({});
        return useBattleSession({
            skills,
            setSkills,
            stats,
            setStats,
            checkAchievements: () => {},
            startBGM: () => {},
        });
    }, options);

beforeEach(() => {
    vi.useFakeTimers();
    monitor.clear();
});

afterEach(() => {
    vi.useRealTimers();
    monitor.clear();
});

describe('useBattleSession monitoring', () => {
    it('records the start of a battle with its skill', () => {
        const { result } = session();
        act(() => result.current.startBattle('math'));
        expect(flows()).toMatchObject([{ name: 'battle-start', detail: { skillId: 'math' } }]);
    });

    it('records the end of a battle that the player leaves', () => {
        const { result } = session();
        act(() => result.current.startBattle('math'));
        act(() => result.current.endBattle());
        expect(flows().at(-1)).toMatchObject({ name: 'battle-end', detail: { skillId: 'math', outcome: 'left' } });
    });

    it('records the end of a battle lost by ten mistakes', () => {
        const { result } = session();
        act(() => result.current.startBattle('math'));
        for (let mistake = 0; mistake < 10; mistake++) {
            act(() => result.current.handleSuccessHit('math', 'WRONG'));
        }
        const ends = flows().filter((event) => event.name === 'battle-end');
        expect(ends).toMatchObject([{ detail: { skillId: 'math', outcome: 'death' } }]);
    });

    it('records no second end when the player leaves while the death screen is shown', () => {
        const { result } = session();
        act(() => result.current.startBattle('math'));
        for (let mistake = 0; mistake < 10; mistake++) {
            act(() => result.current.handleSuccessHit('math', 'WRONG'));
        }
        act(() => result.current.endBattle());
        const ends = flows().filter((event) => event.name === 'battle-end');
        expect(ends).toMatchObject([{ detail: { outcome: 'death' } }]);
    });

    it('records no second end when the game goes away while the death screen is shown', () => {
        const { result, unmount } = session();
        act(() => result.current.startBattle('math'));
        for (let mistake = 0; mistake < 10; mistake++) {
            act(() => result.current.handleSuccessHit('math', 'WRONG'));
        }
        unmount();
        expect(flows().filter((event) => event.name === 'battle-end')).toHaveLength(1);
    });

    it('records the end of a memory battle once it is completed', () => {
        const { result } = session();
        act(() => result.current.startBattle('memory'));
        act(() => result.current.handleSuccessHit('memory'));
        expect(flows().at(-1)).toMatchObject({
            name: 'battle-end',
            detail: { skillId: 'memory', outcome: 'completed' },
        });
    });

    it('records nothing when the answer is right in a math battle', () => {
        const { result } = session();
        act(() => result.current.startBattle('math'));
        act(() => result.current.handleSuccessHit('math'));
        expect(flows()).toHaveLength(1);
    });

    it('records the end of a battle that is still running when the game goes away', () => {
        const { result, unmount } = session();
        act(() => result.current.startBattle('reading'));
        unmount();
        expect(flows().at(-1)).toMatchObject({
            name: 'battle-end',
            detail: { skillId: 'reading', outcome: 'left' },
        });
    });

    it('records nothing when the game goes away outside a battle', () => {
        const { result, unmount } = session();
        act(() => result.current.startBattle('math'));
        act(() => result.current.endBattle());
        monitor.clear();
        unmount();
        expect(flows()).toEqual([]);
    });

    it('records one end of battle at the unmount under StrictMode, and nothing at the mount', () => {
        const { result, unmount } = session({ wrapper: StrictMode });
        expect(flows()).toEqual([]);
        act(() => result.current.startBattle('math'));
        unmount();
        expect(flows().filter((event) => event.name === 'battle-end')).toHaveLength(1);
    });
});
