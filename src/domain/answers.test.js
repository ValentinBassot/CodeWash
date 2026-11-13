import { describe, expect, it } from 'vitest';
import { normalizeNumber, normalizeSpelling, withoutSpaces } from './answers';

describe('withoutSpaces', () => {
    it('removes every space, tab and line break', () => {
        expect(withoutSpaces('ICE CREAM\tCONE\n')).toBe('ICECREAMCONE');
        expect(withoutSpaces('')).toBe('');
    });
});

describe('normalizeNumber', () => {
    it('keeps digits and the minus sign only', () => {
        expect(normalizeNumber('-12')).toBe('-12');
        expect(normalizeNumber('1a2 b3.')).toBe('123');
        expect(normalizeNumber('abc')).toBe('');
    });
});

describe('normalizeSpelling', () => {
    it('upper-cases and removes the spaces', () => {
        expect(normalizeSpelling('ice cream')).toBe('ICECREAM');
        expect(normalizeSpelling(' a b ')).toBe('AB');
    });
});
