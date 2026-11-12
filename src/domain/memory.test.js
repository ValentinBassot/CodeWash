import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dealMemoryCards } from './memory';
import { createSeededRandom, resetRandomSource, setRandomSource } from './random';

const FACES = { cat: 'cat.png', dog: 'dog.png', fox: 'fox.png', owl: 'owl.png' };

beforeEach(() => setRandomSource(createSeededRandom(8)));
afterEach(() => resetRandomSource());

describe('dealMemoryCards', () => {
    it('deals two cards for each pair, each with its picture and its own id', () => {
        const cards = dealMemoryCards(FACES, 3);
        expect(cards).toHaveLength(6);
        expect(cards.map((card) => card.id)).toEqual([0, 1, 2, 3, 4, 5]);
        const counts = {};
        for (const card of cards) {
            counts[card.color] = (counts[card.color] || 0) + 1;
            expect(card.img).toBe(FACES[card.color]);
        }
        expect(Object.values(counts)).toEqual([2, 2, 2]);
    });

    it('does not deal the same game twice', () => {
        const first = dealMemoryCards(FACES, 4).map((card) => card.color);
        const second = dealMemoryCards(FACES, 4).map((card) => card.color);
        expect(second).not.toEqual(first);
    });
});
