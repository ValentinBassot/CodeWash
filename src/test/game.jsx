import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';
import { createSeededRandom, setRandomSource } from '../domain/random';

export const save = () => JSON.parse(localStorage.getItem('heroSkills_v23_p1'));

export const skill = (id) => save().skills[id];

export const startNewGame = () => {
    const { unmount } = render(<App />);
    const fresh = save();
    unmount();
    localStorage.clear();
    return fresh;
};

export const playWith = (edit) => {
    const fresh = startNewGame();
    edit(fresh);
    localStorage.setItem('heroSkills_v23_p1', JSON.stringify(fresh));
    return render(<App />);
};

export const pressCard = (actionName) => fireEvent.click(screen.getByRole('button', { name: actionName }));

export const typeInto = (input, value) => fireEvent.change(input, { target: { value } });

export const wait = (ms) => act(() => vi.advanceTimersByTime(ms));

export const nextRandomValues = (...values) => {
    const after = createSeededRandom(1);
    const queue = [...values];
    setRandomSource(() => (queue.length > 0 ? queue.shift() : after()));
};

export const useGameClock = () => {
    setRandomSource(createSeededRandom(1));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
};
