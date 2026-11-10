import { describe, expect, it } from 'vitest';
import { judgeSpokenWord, normalizeSpeech } from './reading';

describe('normalizeSpeech', () => {
    it('upper-cases and removes punctuation', () => {
        expect(normalizeSpeech('cat.')).toBe('CAT');
        expect(normalizeSpeech('(see)!')).toBe('SEE');
        expect(normalizeSpeech('ice-cream')).toBe('ICECREAM');
    });

    it('keeps spaces and digits', () => {
        expect(normalizeSpeech('i love mom 2')).toBe('I LOVE MOM 2');
    });
});

describe('judgeSpokenWord', () => {
    it('the exact word is correct', () => {
        expect(judgeSpokenWord('CAT', 'CAT')).toBe('correct');
    });

    it('a homophone of the word is correct, even a single letter or a digit', () => {
        expect(judgeSpokenWord('SEA', 'SEE')).toBe('correct');
        expect(judgeSpokenWord('C', 'SEE')).toBe('correct');
        expect(judgeSpokenWord('2', 'TO')).toBe('correct');
    });

    it('another word of two letters or more is wrong', () => {
        expect(judgeSpokenWord('DOG', 'CAT')).toBe('wrong');
        expect(judgeSpokenWord('NO', 'CAT')).toBe('wrong');
    });

    it('a single letter or nothing is noise', () => {
        expect(judgeSpokenWord('A', 'CAT')).toBe('noise');
        expect(judgeSpokenWord('', 'CAT')).toBe('noise');
    });
});
