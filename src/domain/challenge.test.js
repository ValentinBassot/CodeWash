import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateChallenge } from './challenge';
import { READING_WORDS } from '../constants/gameData';
import { createSeededRandom, resetRandomSource, setRandomSource } from './random';

beforeEach(() => setRandomSource(createSeededRandom(6)));
afterEach(() => resetRandomSource());

describe('generateChallenge', () => {
    it('math asks a problem of the difficulty with its answer', () => {
        const challenge = generateChallenge('math', 1);
        expect(challenge.type).toBe('math');
        expect(challenge.question).toMatch(/^\d+ \+ \d+ = \?$/);
        const [a, b] = challenge.question.match(/\d+/g).map(Number);
        expect(challenge.answer).toBe(String(a + b));
    });

    it('reading shows a word of the difficulty, which is also the answer', () => {
        const challenge = generateChallenge('reading', 1);
        expect(READING_WORDS[3]).toContain(challenge.question);
        expect(challenge).toEqual({ type: 'reading', question: challenge.question, answer: challenge.question });
    });

    it('writing shows the picture of an item and expects its name in capitals', () => {
        const challenge = generateChallenge('writing', 1);
        expect(challenge).toMatchObject({ type: 'writing', question: 'Spell it!' });
        expect(challenge.answer).toBe(challenge.displayName.toUpperCase());
        expect(challenge.images).toEqual([expect.any(String)]);
    });

    it('patterns and memory only announce their game', () => {
        expect(generateChallenge('patterns', 3)).toEqual({ type: 'patterns', question: 'Simon Says!', answer: 'WIN' });
        expect(generateChallenge('memory', 3)).toEqual({ type: 'memory', question: 'Find Pairs!', answer: 'WIN' });
    });

    it('any other skill is a manual task', () => {
        expect(generateChallenge('manual', 1)).toEqual({ type: 'manual', question: 'Task Complete?', answer: 'yes' });
        expect(generateChallenge(undefined, 1)).toEqual({ type: 'manual', question: 'Task Complete?', answer: 'yes' });
    });
});
