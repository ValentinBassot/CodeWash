import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
    if (typeof window === 'undefined') return;
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
    cleanup();
    if (typeof localStorage !== 'undefined') localStorage.clear();
});
