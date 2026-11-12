import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import App from './App';
import { useGameClock } from './test/game';

const describeElement = (element) => element.outerHTML.replace(/\s+/g, ' ').slice(0, 140);
const topButton = (icon) => document.querySelector(`button > svg.lucide-${icon}`).closest('button');
const isNamed = (element) =>
    Boolean(element.textContent.trim() || element.getAttribute('aria-label') || element.getAttribute('title'));
const isLabelled = (input) =>
    Boolean(input.getAttribute('aria-label') || input.labels?.length || input.getAttribute('placeholder'));

const unnamedButtons = () => [...document.querySelectorAll('button')].filter((b) => !isNamed(b)).map(describeElement);
const imagesWithoutAlt = () =>
    [...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).map(describeElement);
const unlabelledInputs = () =>
    [...document.querySelectorAll('input')].filter((i) => !isLabelled(i)).map(describeElement);

beforeEach(() => {
    useGameClock();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('accessibility (D54)', () => {
    it('every button has a name', () => {
        render(<App />);
        expect(unnamedButtons()).toEqual([]);
    });

    it('every image has an alt attribute', () => {
        render(<App />);
        expect(imagesWithoutAlt()).toEqual([]);
    });

    it('every input has a label', () => {
        render(<App />);
        expect(unlabelledInputs()).toEqual([]);
    });

    it.each(['Calculate!', 'Craft!'])('a "%s" battle keeps buttons, images and inputs named', (action) => {
        render(<App />);
        fireEvent.click([...document.querySelectorAll('button')].find((b) => b.textContent === action));
        expect(document.querySelector('input[type="text"]')).toBeTruthy();
        expect(unnamedButtons()).toEqual([]);
        expect(imagesWithoutAlt()).toEqual([]);
        expect(unlabelledInputs()).toEqual([]);
    });

    it.each(['settings', 'sparkles', 'menu'])('Escape closes the %s drawer', (icon) => {
        render(<App />);
        const drawer = () =>
            [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.getAttribute('aria-hidden') !== 'true');
        fireEvent.click(topButton(icon));
        expect(drawer()).toHaveLength(1);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(drawer()).toHaveLength(0);
    });
});
