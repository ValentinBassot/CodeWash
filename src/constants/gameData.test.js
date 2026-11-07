import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    BASE_ASSETS,
    BOSS_MOBS,
    CHEST_BLOCKS,
    DIFFICULTY_IMAGES,
    FRIENDLY_MOBS,
    HOSTILE_MOBS,
    MINIBOSS_MOBS,
    READING_WORDS,
    SKILL_DATA,
    THEME_CONFIG,
    THEMES_LIST,
    WRITING_DIFFICULTY_POOLS,
    WRITING_WORD_INDEX,
    formatDisplayName,
} from './gameData';
import { AURA_ADJECTIVES, generateMobWithAura, getRandomAura } from '../utils/mobDisplayUtils';

const assetPaths = (value, found = []) => {
    if (typeof value === 'string' && value.startsWith('assets/')) found.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach((v) => assetPaths(v, found));
    return [...new Set(found)];
};
const missing = (value) => assetPaths(value).filter((p) => !existsSync(resolve('public', p)));

afterEach(() => vi.restoreAllMocks());

describe('game structure', () => {
    it('has six skills in this order', () => {
        expect(SKILL_DATA.map((s) => s.id)).toEqual(['reading', 'math', 'writing', 'cleaning', 'memory', 'patterns']);
    });

    it('has four themes, the same in the picker and in the configuration', () => {
        expect(THEMES_LIST.map((t) => t.id)).toEqual(['minecraft', 'kpop', 'pokemon', 'spy']);
        expect(Object.keys(THEME_CONFIG)).toEqual(THEMES_LIST.map((t) => t.id));
    });

    it('counts its creatures', () => {
        expect(Object.keys(HOSTILE_MOBS)).toHaveLength(20);
        expect(Object.keys(FRIENDLY_MOBS)).toHaveLength(26);
        expect(Object.keys(BOSS_MOBS)).toHaveLength(4);
        expect(Object.keys(MINIBOSS_MOBS)).toHaveLength(4);
        expect(Object.keys(CHEST_BLOCKS)).toHaveLength(6);
    });

    it('has a writing pool for difficulties 1 to 5, each word in upper-caseable form with its picture', () => {
        expect(Object.keys(WRITING_DIFFICULTY_POOLS)).toEqual(['1', '2', '3', '4', '5']);
        for (const pool of Object.values(WRITING_DIFFICULTY_POOLS)) {
            expect(pool.length).toBeGreaterThan(0);
            for (const item of pool) expect(item).toEqual(expect.objectContaining({ word: expect.any(String) }));
        }
    });
});

describe('asset files', () => {
    it.each([
        ['mobs and chests', { HOSTILE_MOBS, FRIENDLY_MOBS, BOSS_MOBS, MINIBOSS_MOBS, CHEST_BLOCKS }],
        ['skills and difficulties', { SKILL_DATA, DIFFICULTY_IMAGES }],
        ['writing pictures', WRITING_WORD_INDEX],
        ['theme thumbnails', THEMES_LIST],
        ['images of BASE_ASSETS', { ...BASE_ASSETS, audio: null }],
    ])('every file of %s exists', (_, data) => {
        expect(missing(data)).toEqual([]);
    });

    it('KNOWN DEBT D32: none of the sounds of BASE_ASSETS.audio exists', () => {
        expect(missing(BASE_ASSETS.audio)).toEqual(assetPaths(BASE_ASSETS.audio));
        expect(assetPaths(BASE_ASSETS.audio)).toHaveLength(10);
    });

    it('KNOWN DEBT D33: four theme images are missing', () => {
        expect(missing(THEME_CONFIG).sort()).toEqual([
            'assets/themes/kpop_memorycard.jpg',
            'assets/themes/pokemon_memorycard.jpg',
            'assets/themes/spy_logo.png',
            'assets/themes/spy_memorycard.jpg',
        ]);
    });
});

describe('reading words', () => {
    it('lists of 3 to 7 letters only hold words of that length', () => {
        for (const length of [3, 4, 5, 6, 7]) {
            expect(READING_WORDS[length].filter((w) => w.length !== length)).toEqual([]);
        }
    });

    it('KNOWN DEBT D42: the 8-letter list holds CROCODILE (9) and a sentence', () => {
        expect(READING_WORDS[8].filter((w) => w.length !== 8)).toEqual(['CROCODILE', 'I LOVE MOM']);
    });
});

describe('display names', () => {
    it('splits known compound names and capitalizes the others', () => {
        expect(formatDisplayName('magmacube')).toBe('Magma Cube');
        expect(formatDisplayName('Shulker_Box')).toBe('Shulker Box');
        expect(formatDisplayName('ZOMBIE')).toBe('Zombie');
        expect(formatDisplayName('')).toBe('');
    });
});

describe('mob auras', () => {
    it('draws an aura from the eight available ones', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(getRandomAura()).toBe('rainbow');
        vi.spyOn(Math, 'random').mockReturnValue(0.99);
        expect(getRandomAura()).toBe('nature');
        expect(Object.keys(AURA_ADJECTIVES)).toHaveLength(8);
    });

    it('names the mob after its aura', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(generateMobWithAura('Zombie', 'zombie.png')).toEqual({
            mobName: 'Zombie',
            mobSrc: 'zombie.png',
            aura: 'rainbow',
            displayName: 'Prismatic Zombie',
        });
    });
});
