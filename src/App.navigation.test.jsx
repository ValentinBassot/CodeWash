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
    it('shows seven cards around the first skill: cleaning twice at the edges', () => {
        render(<App />);
        expect(cardButtons('Organize!')).toHaveLength(2);
        expect(cardButtons('Calculate!')).toHaveLength(1);
    });

    it('the right arrow moves to the next skill', () => {
        render(<App />);
        fireEvent.click(rightArrow());
        expect(cardButtons('Match!')).toHaveLength(2);
        expect(cardButtons('Organize!')).toHaveLength(1);
    });

    it('the left arrow moves to the previous skill', () => {
        render(<App />);
        fireEvent.click(leftArrow());
        expect(cardButtons('Craft!')).toHaveLength(2);
    });

    it('a swipe of 100 pixels or more turns the carousel, a shorter one does not', () => {
        render(<App />);
        swipe(300, 250);
        expect(cardButtons('Organize!')).toHaveLength(2);
        swipe(300, 150);
        expect(cardButtons('Match!')).toHaveLength(2);
        swipe(100, 250);
        expect(cardButtons('Organize!')).toHaveLength(2);
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

    it('is hidden before the first boss', () => {
        render(<App />);
        expect(document.querySelector('svg.lucide-plus')).toBeNull();
    });
});
