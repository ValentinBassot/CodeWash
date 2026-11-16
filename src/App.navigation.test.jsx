import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { getBGMManager, getSfxVolume } from './utils/soundManager';
import { playWith, skill, useGameClock } from './test/game';

const topButton = (icon) => document.querySelector(`button > svg.lucide-${icon}`).closest('button');
const overlays = () =>
    [...document.querySelectorAll('div.fixed.inset-0')].filter((d) => d.className.includes('bg-black/50'));
const cardButtons = (name) => screen.queryAllByRole('button', { name });
const leftArrow = () => document.querySelector('button.left-0.h-full');
const rightArrow = () => document.querySelector('button.right-0.h-full');
const carousel = () =>
    [...document.querySelectorAll('div.perspective-1000')].find((d) => d.className.includes('h-[650px]'));
const swipe = (fromX, toX) => {
    fireEvent.touchStart(carousel(), { touches: [{ clientX: fromX }] });
    fireEvent.touchMove(carousel(), { touches: [{ clientX: toX }] });
    fireEvent.touchEnd(carousel());
};
const difficultyButton = (icon) => document.querySelector(`button > svg.lucide-${icon}`).closest('button');

beforeEach(() => {
    useGameClock();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('skill carousel', () => {
    it('shows five cards around the first skill, the two farther ones being out of reach', () => {
        render(<App />);
        for (const action of ['Enchant!', 'Calculate!', 'Craft!', 'Solve!', 'Match!']) {
            expect(cardButtons(action)).toHaveLength(1);
        }
        expect(cardButtons('Organize!')).toHaveLength(0);
    });

    it('the cards that are not shown cannot be reached nor clicked', () => {
        render(<App />);
        const hidden = [...document.querySelectorAll('div.perspective-1000 > div[aria-hidden="true"]')];
        expect(hidden).toHaveLength(8);
        for (const card of hidden) {
            expect(card.hasAttribute('inert')).toBe(true);
            expect(card.style.pointerEvents).toBe('none');
            expect(card.style.opacity).toBe('0');
        }
    });

    it('the right arrow moves to the next skill', () => {
        render(<App />);
        fireEvent.click(rightArrow());
        expect(cardButtons('Organize!')).toHaveLength(1);
        expect(cardButtons('Match!')).toHaveLength(0);
        expect(cardButtons('Calculate!')).toHaveLength(1);
    });

    it('the left arrow moves to the previous skill', () => {
        render(<App />);
        fireEvent.click(leftArrow());
        expect(cardButtons('Organize!')).toHaveLength(1);
        expect(cardButtons('Craft!')).toHaveLength(0);
        expect(cardButtons('Solve!')).toHaveLength(1);
    });

    it('a swipe of 100 pixels or more turns the carousel, a shorter one does not', () => {
        render(<App />);
        swipe(300, 250);
        expect(cardButtons('Organize!')).toHaveLength(0);
        swipe(300, 150);
        expect(cardButtons('Organize!')).toHaveLength(1);
        swipe(100, 250);
        expect(cardButtons('Organize!')).toHaveLength(0);
    });
});

describe('drawers', () => {
    it.each([
        ['settings', 'settings'],
        ['cosmetics', 'sparkles'],
        ['achievements', 'menu'],
    ])('the %s drawer opens with a dark overlay that closes it on click', (_, icon) => {
        render(<App />);
        expect(overlays()).toHaveLength(0);
        fireEvent.click(topButton(icon));
        expect(overlays()).toHaveLength(1);
        fireEvent.click(overlays()[0]);
        expect(overlays()).toHaveLength(0);
    });

    it('the volume sliders set the music and effects volumes', () => {
        render(<App />);
        fireEvent.click(topButton('settings'));
        const [music, effects] = document.querySelectorAll('input[type="range"]');
        fireEvent.change(music, { target: { value: '0.75' } });
        fireEvent.change(effects, { target: { value: '0.1' } });
        expect(getBGMManager().volume).toBe(0.75);
        expect(getSfxVolume()).toBe(0.1);
    });
});

describe('bug report', () => {
    it('KNOWN DEBT D37: the bug button opens a modal that only sympathizes', () => {
        render(<App />);
        fireEvent.click(topButton('bug'));
        expect(screen.getByText('Discovered a bug?')).toBeTruthy();
        expect(screen.getByText('Whoa... That sucks...')).toBeTruthy();
        expect(screen.queryByRole('textbox')).toBeNull();
    });
});

describe('difficulty picker', () => {
    it('appears once a boss is beaten and changes the difficulty of the next mobs', () => {
        playWith((s) => {
            s.skills.reading.level = 21;
        });
        fireEvent.click(difficultyButton('plus'));
        expect(skill('reading')).toMatchObject({ difficulty: 2, mobHealth: 180, mobMaxHealth: 180 });
        fireEvent.click(difficultyButton('plus'));
        expect(skill('reading').difficulty).toBe(2);
        fireEvent.click(difficultyButton('minus'));
        expect(skill('reading')).toMatchObject({ difficulty: 1, mobHealth: 60 });
    });

    it('stays available when the difficulty is already above what the level unlocks, so it can be lowered', () => {
        playWith((s) => {
            s.skills.reading.level = 20;
            s.skills.reading.difficulty = 2;
            s.skills.reading.mobHealth = 180;
            s.skills.reading.mobMaxHealth = 180;
        });
        fireEvent.click(difficultyButton('minus'));
        expect(skill('reading')).toMatchObject({ difficulty: 1, mobHealth: 60 });
        expect(document.querySelector('svg.lucide-plus')).toBeNull();
    });

    it('is still hidden at level 20, while the first boss is not beaten', () => {
        playWith((s) => {
            s.skills.reading.level = 20;
        });
        expect(document.querySelector('svg.lucide-plus')).toBeNull();
    });

    it('opens one more difficulty after each boss, up to 7', () => {
        playWith((s) => {
            s.skills.reading.level = 41;
            s.skills.reading.difficulty = 2;
        });
        fireEvent.click(difficultyButton('plus'));
        fireEvent.click(difficultyButton('plus'));
        expect(skill('reading').difficulty).toBe(3);
    });

    it('is hidden before the first boss', () => {
        render(<App />);
        expect(document.querySelector('svg.lucide-plus')).toBeNull();
    });
});
