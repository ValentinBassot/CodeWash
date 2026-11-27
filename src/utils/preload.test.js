import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    ASSET_WEIGHT,
    CODE_WEIGHT,
    DATA_WEIGHT,
    createProgress,
    criticalAssets,
    loadGame,
    IMAGE_TIMEOUT_MS,
    loadImage,
    readSavedTheme,
} from './preload';
import { SAVE_KEYS } from '../persistence/profileStorage';

const memoryStorage = (entries = {}) => ({ getItem: (key) => entries[key] ?? null });

const THEMES = {
    minecraft: {
        style: { backgroundImage: `url('assets/themes/minecraft.png')` },
        assets: { logo: 'assets/themes/minecraft_logo.png' },
    },
    kpop: {
        style: { backgroundImage: 'url("assets/themes/kpop.jpg")' },
        assets: { logo: 'assets/themes/kpop_logo.png' },
    },
    bare: {},
};
const SKILLS = [{ img: 'assets/skills/a.png' }, { img: 'assets/skills/b.png' }, { img: 'assets/skills/a.png' }];

const stubImage = (outcome) => {
    const created = [];
    class FakeImage {
        constructor() {
            created.push(this);
            queueMicrotask(() => this[outcome]?.());
        }
    }
    vi.stubGlobal('Image', FakeImage);
    return created;
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('loadImage', () => {
    it('resolves true once the image is loaded and starts the request', async () => {
        const created = stubImage('onload');
        await expect(loadImage('assets/a.png')).resolves.toBe(true);
        expect(created[0].src).toBe('assets/a.png');
    });

    it('resolves false when the image cannot be loaded', async () => {
        stubImage('onerror');
        await expect(loadImage('assets/missing.png')).resolves.toBe(false);
    });

    it('resolves false when the request never answers', async () => {
        vi.useFakeTimers();
        stubImage('never');
        const result = loadImage('assets/slow.png');
        await vi.advanceTimersByTimeAsync(IMAGE_TIMEOUT_MS);
        await expect(result).resolves.toBe(false);
        vi.useRealTimers();
    });
});

describe('readSavedTheme', () => {
    it('reads the theme of the current profile', () => {
        const storage = memoryStorage({
            [SAVE_KEYS.currentProfile]: '2',
            [SAVE_KEYS.profileSave(2)]: JSON.stringify({ theme: 'kpop' }),
        });
        expect(readSavedTheme(storage)).toBe('kpop');
    });

    it('falls back to the default theme without a save, without a theme or with a broken save', () => {
        expect(readSavedTheme(memoryStorage())).toBe('minecraft');
        expect(readSavedTheme(memoryStorage({ [SAVE_KEYS.profileSave(1)]: '{}' }))).toBe('minecraft');
        expect(readSavedTheme(memoryStorage({ [SAVE_KEYS.profileSave(1)]: '{broken' }))).toBe('minecraft');
    });
});

describe('criticalAssets', () => {
    it('lists the background, the logo and the skill icons once each', () => {
        expect(criticalAssets({ themeConfig: THEMES, skillData: SKILLS }, 'kpop')).toEqual([
            'assets/themes/kpop.jpg',
            'assets/themes/kpop_logo.png',
            'assets/skills/a.png',
            'assets/skills/b.png',
        ]);
    });

    it('uses the default theme when the saved one does not exist', () => {
        const paths = criticalAssets({ themeConfig: THEMES, skillData: [] }, 'unknown');
        expect(paths).toEqual(['assets/themes/minecraft.png', 'assets/themes/minecraft_logo.png']);
    });

    it('skips what a theme does not declare', () => {
        expect(criticalAssets({ themeConfig: { ...THEMES, minecraft: THEMES.bare }, skillData: [] }, 'bare')).toEqual(
            [],
        );
    });
});

describe('createProgress', () => {
    it('reports whole percents that only go up and never pass 100', () => {
        const reported = [];
        const advance = createProgress((percent) => reported.push(percent));
        advance(0.4);
        advance(0.4);
        advance(1.2);
        advance(40);
        advance(200);
        advance(5);
        expect(reported).toEqual([2, 42, 100]);
    });

    it('rounds down, so 100 means everything is done', () => {
        const reported = [];
        const advance = createProgress((percent) => reported.push(percent));
        for (let i = 0; i < 3; i++) advance(100 / 3);
        expect(reported).toEqual([33, 66, 100]);
    });
});

describe('loadGame', () => {
    const App = () => null;
    const data = { THEME_CONFIG: THEMES, SKILL_DATA: SKILLS };
    const load = (overrides = {}) => {
        const reported = [];
        const promise = loadGame({
            importApp: () => Promise.resolve({ default: App }),
            importData: () => Promise.resolve(data),
            storage: memoryStorage(),
            onProgress: (percent) => reported.push(percent),
            loadAsset: () => Promise.resolve(true),
            ...overrides,
        });
        return { promise, reported };
    };

    it('weights code, data and assets so that they add up to 100', () => {
        expect(CODE_WEIGHT + DATA_WEIGHT + ASSET_WEIGHT).toBe(100);
    });

    it('returns the game once the code, the data and every critical asset are loaded', async () => {
        const loaded = [];
        const { promise, reported } = load({ loadAsset: (path) => Promise.resolve(loaded.push(path)) });
        await expect(promise).resolves.toBe(App);
        expect(loaded).toEqual([
            'assets/themes/minecraft.png',
            'assets/themes/minecraft_logo.png',
            'assets/skills/a.png',
            'assets/skills/b.png',
        ]);
        expect(reported.at(-1)).toBe(100);
        expect(reported).toEqual([...reported].sort((a, b) => a - b));
    });

    it('does not report 100 before the last asset is loaded', async () => {
        let release;
        const gate = new Promise((resolve) => {
            release = resolve;
        });
        const { promise, reported } = load({
            loadAsset: (path) => (path.endsWith('b.png') ? gate : Promise.resolve(true)),
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(reported.at(-1)).toBeLessThan(100);
        release();
        await promise;
        expect(reported.at(-1)).toBe(100);
    });

    it('counts a missing asset as done so the game still opens', async () => {
        const { promise, reported } = load({ loadAsset: () => Promise.resolve(false) });
        await expect(promise).resolves.toBe(App);
        expect(reported.at(-1)).toBe(100);
    });

    it('fails when the code cannot be loaded', async () => {
        const { promise } = load({ importApp: () => Promise.reject(new Error('offline')) });
        await expect(promise).rejects.toThrow('offline');
    });
});
