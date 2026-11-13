import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { firstNewAchievement, useAchievementToast } from './useAchievementToast';
import { getDefaultStats } from '../utils/achievementUtils';

const stats = (overrides = {}) => ({ ...getDefaultStats(), ...overrides });
const SKILLS = { math: { level: 1 } };

describe('firstNewAchievement', () => {
    it('gives nothing when nothing was unlocked', () => {
        expect(firstNewAchievement(stats(), stats(), SKILLS, SKILLS)).toBeNull();
    });

    it('gives the first achievement unlocked by the change', () => {
        const after = stats({ totalMobsDefeated: 1, totalDeaths: 1 });
        expect(firstNewAchievement(stats(), after, SKILLS, SKILLS)).toEqual({
            achievementId: 'first_steps',
            tierIndex: null,
        });
    });

    it('gives the new tier of a tiered achievement already unlocked', () => {
        const before = stats({ phantomsCaught: 5 });
        const after = stats({ phantomsCaught: 10 });
        expect(firstNewAchievement(before, after, SKILLS, SKILLS)).toEqual({
            achievementId: 'phantom_hunter',
            tierIndex: 1,
        });
    });
});

describe('useAchievementToast', () => {
    let play;

    beforeEach(() => {
        vi.useFakeTimers();
        play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows nothing and stays silent when nothing was unlocked', () => {
        const { result } = renderHook(() => useAchievementToast());
        act(() => result.current.announce(stats(), stats(), SKILLS, SKILLS));
        expect(result.current.toast).toBeNull();
        expect(play).not.toHaveBeenCalled();
    });

    it('shows two achievements announced together one after the other, each for 6 seconds', () => {
        const { result } = renderHook(() => useAchievementToast());
        act(() => {
            result.current.announce(stats(), stats({ totalDeaths: 1 }), SKILLS, SKILLS);
            result.current.announce(stats(), stats({ totalMobsDefeated: 1 }), SKILLS, SKILLS);
        });
        expect(result.current.toast.achievementId).toBe('ouch');
        act(() => vi.advanceTimersByTime(6000));
        expect(result.current.toast.achievementId).toBe('first_steps');
        act(() => vi.advanceTimersByTime(5999));
        expect(result.current.toast.achievementId).toBe('first_steps');
        act(() => vi.advanceTimersByTime(1));
        expect(result.current.toast).toBeNull();
    });

    it('a toast announced while another is shown still gets its full 6 seconds', () => {
        const { result } = renderHook(() => useAchievementToast());
        act(() => result.current.announce(stats(), stats({ totalDeaths: 1 }), SKILLS, SKILLS));
        act(() => vi.advanceTimersByTime(4000));
        act(() => result.current.announce(stats(), stats({ totalMobsDefeated: 1 }), SKILLS, SKILLS));
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.toast.achievementId).toBe('first_steps');
        act(() => vi.advanceTimersByTime(5999));
        expect(result.current.toast.achievementId).toBe('first_steps');
    });

    it('shows the new achievement with a sound, then hides it after 6 seconds', () => {
        const { result } = renderHook(() => useAchievementToast());
        act(() => result.current.announce(stats(), stats({ totalDeaths: 1 }), SKILLS, SKILLS));
        expect(result.current.toast).toEqual({ achievementId: 'ouch', tierIndex: null });
        expect(play).toHaveBeenCalledTimes(1);

        act(() => vi.advanceTimersByTime(5999));
        expect(result.current.toast).not.toBeNull();
        act(() => vi.advanceTimersByTime(1));
        expect(result.current.toast).toBeNull();
    });
});
