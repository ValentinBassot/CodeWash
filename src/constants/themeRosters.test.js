import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_ROSTERS } from './themeRosters';
import { THEME_CONFIG } from './gameData';

const onDisk = (src) => existsSync(resolve('public', src));
const KINDS = ['hostile', 'miniboss', 'boss'];

describe('theme rosters', () => {
    it('the themes with their own mobs are the same in the rosters and in the configuration', () => {
        expect(Object.keys(THEME_ROSTERS).sort()).toEqual(['kpop', 'pokemon']);
        for (const theme of Object.keys(THEME_ROSTERS)) {
            expect(THEME_CONFIG[theme].assets.roster).toBe(THEME_ROSTERS[theme]);
        }
        for (const theme of ['minecraft', 'spy']) expect(THEME_CONFIG[theme].assets.roster).toBeUndefined();
    });

    it.each(Object.keys(THEME_ROSTERS))('%s has mobs of every kind, with a name and a picture', (theme) => {
        for (const kind of KINDS) {
            expect(THEME_ROSTERS[theme][kind].length).toBeGreaterThan(0);
            for (const mob of THEME_ROSTERS[theme][kind]) {
                expect(mob.name).toEqual(expect.any(String));
                expect(mob.src.startsWith(`assets/mobs/${theme}/`)).toBe(true);
            }
        }
    });

    it.each(Object.keys(THEME_ROSTERS))('every picture of %s is on disk', (theme) => {
        const missing = KINDS.flatMap((kind) => THEME_ROSTERS[theme][kind])
            .map((mob) => mob.src)
            .filter((src) => !onDisk(src));
        expect(missing).toEqual([]);
    });

    it('a theme never uses the same mob name twice in a kind', () => {
        for (const theme of Object.keys(THEME_ROSTERS)) {
            for (const kind of KINDS) {
                const names = THEME_ROSTERS[theme][kind].map((mob) => mob.name);
                expect(new Set(names).size).toBe(names.length);
            }
        }
    });
});
