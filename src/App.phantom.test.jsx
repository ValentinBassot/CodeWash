import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { pressCard, save, skill, useGameClock, wait } from './test/game';

const MINUTE = 60 * 1000;
const phantom = () => document.querySelector('div.fixed.top-4 img[alt="Phantom"]');
const catchPhantom = () => fireEvent.click(phantom().closest('div.fixed'));
const waitForPhantom = (limit) => {
    for (let t = 0; t < limit && !phantom(); t += 1000) wait(1000);
};

beforeEach(useGameClock);

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('phantom fly-by', () => {
    it('a new player sees a phantom within 5 minutes; it crosses the screen in 8 seconds', () => {
        const start = Date.now();
        render(<App />);
        expect(phantom()).toBeNull();

        waitForPhantom(5 * MINUTE);
        expect(phantom()).not.toBeNull();
        const spawnedAt = Number(localStorage.getItem('phantomEvent_lastSpawn_v1'));
        expect(spawnedAt).toBeGreaterThan(start);
        expect(spawnedAt).toBeLessThanOrEqual(Date.now());

        wait(7000);
        expect(phantom()).not.toBeNull();
        wait(1000);
        expect(phantom()).toBeNull();
    });

    it('catching it counts one phantom and shows +1 Level!, without a level outside battles', () => {
        render(<App />);
        waitForPhantom(5 * MINUTE);
        catchPhantom();

        expect(screen.getByText('+1 Level!')).toBeTruthy();
        expect(save().stats.phantomsCaught).toBe(1);
        expect(Object.values(save().skills).map((s) => s.level)).toEqual([1, 1, 1, 1, 1, 1]);

        wait(200);
        expect(phantom()).toBeNull();
    });

    it('catching it during a battle gives one level to that skill', () => {
        render(<App />);
        pressCard('Calculate!');
        waitForPhantom(5 * MINUTE);
        catchPhantom();

        expect(skill('math').level).toBe(2);
        expect(screen.getByText('Phantom Bonus!')).toBeTruthy();
    });

    it('a second click on the same phantom counts nothing more', () => {
        render(<App />);
        waitForPhantom(5 * MINUTE);
        catchPhantom();
        catchPhantom();
        expect(save().stats.phantomsCaught).toBe(1);
    });

    it('waits at least 5 minutes after the last phantom, even across a restart', () => {
        localStorage.setItem('phantomEvent_lastSpawn_v1', String(Date.now() - MINUTE));
        render(<App />);

        wait(4 * MINUTE - 1);
        expect(phantom()).toBeNull();
        expect(localStorage.getItem('phantomEvent_lastSpawn_v1')).toBe(String(Date.now() - 4 * MINUTE + 1 - MINUTE));

        waitForPhantom(5 * MINUTE + 1000);
        expect(phantom()).not.toBeNull();
    });
});
