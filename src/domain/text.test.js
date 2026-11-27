import { describe, expect, it } from 'vitest';
import { countChars, cutText, wellFormed } from './text';

describe('countChars', () => {
    it('counts characters, not UTF-16 units', () => {
        expect(countChars('ab')).toBe(2);
        expect(countChars('a😀b')).toBe(3);
    });
});

describe('cutText', () => {
    it('keeps a short text as it is', () => {
        expect(cutText('abc', 3)).toBe('abc');
    });

    it('cuts after the given number of characters', () => {
        expect(cutText('abcdef', 4)).toBe('abcd');
    });

    it('never cuts an emoji in two', () => {
        expect(cutText('ab😀cd', 3)).toBe('ab😀');
        expect(cutText('ab😀cd', 2)).toBe('ab');
        expect(() => encodeURIComponent(cutText('a'.repeat(499) + '😀😀', 500))).not.toThrow();
    });
});

describe('wellFormed', () => {
    it('replaces a lone surrogate so that the text can go in a link', () => {
        const broken = `a${'😀'.slice(0, 1)}b`;
        expect(() => encodeURIComponent(broken)).toThrow(URIError);
        expect(() => encodeURIComponent(wellFormed(broken))).not.toThrow();
        expect(wellFormed('fine 😀')).toBe('fine 😀');
    });
});
