import { describe, expect, it } from 'vitest';
import { getBorderEffect, getButtonStyle, getLevelStyle, resolveMob } from './cardStyle';
import { BASE_ASSETS, BOSS_MOBS, CHEST_BLOCKS, HOSTILE_MOBS, MINIBOSS_MOBS } from '../../../constants/gameData';
import { THEME_ROSTERS } from '../../../constants/themeRosters';

describe('getLevelStyle', () => {
    it.each([
        [1, 'text-white', 'border-stone-500'],
        [19, 'text-white', 'border-stone-500'],
        [20, 'text-amber-700', 'border-wood'],
        [40, 'text-stone-400', 'border-stone'],
        [60, 'text-yellow-400', 'border-gold'],
        [80, 'text-gray-200', 'border-iron'],
        [100, 'text-emerald-400', 'border-emerald'],
        [120, 'text-cyan-300', 'border-diamond'],
        [140, 'text-gray-500', 'border-netherite'],
        [160, 'text-rainbow', 'border-netherite'],
        [999, 'text-rainbow', 'border-netherite'],
    ])('level %s gets %s and %s', (level, textColor, borderClass) => {
        expect(getLevelStyle(level)).toEqual({ textColor, borderClass });
    });
});

describe('getBorderEffect', () => {
    it('has no effect without a selected border', () => {
        expect(getBorderEffect(null, '#123456')).toEqual({ className: '', style: {} });
    });

    it('locks the solid border to gold', () => {
        const { className, style } = getBorderEffect('solid', '#123456');
        expect(className).toBe('');
        expect(style.borderColor).toBe('#FFD700');
        expect(style.boxShadow).toContain('#FFD700');
    });

    it('lets the picker choose the colour, gold when none is chosen', () => {
        expect(getBorderEffect('solid-picker', '#123456').style.borderColor).toBe('#123456');
        expect(getBorderEffect('solid-picker', null).style.borderColor).toBe('#FFD700');
    });

    it('passes the colour to the gradient and sparkle borders', () => {
        expect(getBorderEffect('gradient', '#123456')).toEqual({
            className: 'border-effect-gradient',
            style: { '--border-color': '#123456' },
        });
        expect(getBorderEffect('sparkle', null).style).toEqual({ '--border-color': '#FFD700' });
    });

    it('uses a plain class for the other borders', () => {
        expect(getBorderEffect('fire', '#123456')).toEqual({ className: 'border-effect-fire', style: {} });
    });
});

describe('getButtonStyle', () => {
    it('takes the first two colours of the card background and darkens the second for the shadow', () => {
        expect(getButtonStyle({ background: 'linear-gradient(#ffffff, #282828)' })).toEqual({
            background: 'linear-gradient(to bottom, #ffffff, #282828)',
            boxShadow: '0 6px 0 #000000',
            borderColor: '#ffffff',
        });
    });

    it('falls back to purple without two colours', () => {
        const purple = getButtonStyle(undefined);
        expect(purple.borderColor).toBe('#a855f7');
        expect(getButtonStyle({ background: '#ffffff' })).toEqual(purple);
    });
});

describe('resolveMob', () => {
    const hostile = Object.keys(HOSTILE_MOBS)[0];
    const boss = Object.keys(BOSS_MOBS)[0];
    const miniboss = Object.keys(MINIBOSS_MOBS)[0];
    const chest = Object.keys(CHEST_BLOCKS)[0];

    it('always shows the farm for memory', () => {
        expect(resolveMob('memory', 'Cow', {})).toEqual({ src: 'assets/skills/farm_icon.png', name: 'Cow' });
    });

    it('shows a chest for cleaning, then a themed mob, then a pink axolotl', () => {
        expect(resolveMob('cleaning', chest, {}).src).toBe(CHEST_BLOCKS[chest]);
        expect(resolveMob('cleaning', 'Themed', { Themed: 'themed.png' }).src).toBe('themed.png');
        expect(resolveMob('cleaning', 'Nothing', {}).src).toBe(BASE_ASSETS.axolotls.Pink);
    });

    it.each(['math', 'patterns'])('finds hostile, boss and miniboss mobs for %s', (skill) => {
        expect(resolveMob(skill, hostile, {})).toEqual({ src: HOSTILE_MOBS[hostile], name: hostile });
        expect(resolveMob(skill, boss, {}).src).toBe(BOSS_MOBS[boss]);
        expect(resolveMob(skill, miniboss, {}).src).toBe(MINIBOSS_MOBS[miniboss]);
        expect(resolveMob(skill, 'Themed', { Themed: 'themed.png' }).src).toBe('themed.png');
    });

    it('shows a zombie when the mob is unknown', () => {
        expect(resolveMob('reading', 'Nope', {})).toEqual({ src: HOSTILE_MOBS.Zombie, name: 'Zombie' });
    });

    describe('with the roster of a theme', () => {
        const roster = THEME_ROSTERS.pokemon;
        const hostiles = Object.keys(HOSTILE_MOBS);

        it('replaces each kind of mob by the mob at the same place in the roster', () => {
            expect(resolveMob('math', hostile, {}, roster)).toEqual(roster.hostile[0]);
            expect(resolveMob('math', hostiles[3], {}, roster)).toEqual(roster.hostile[3]);
            expect(resolveMob('math', boss, {}, roster)).toEqual(roster.boss[0]);
            expect(resolveMob('math', miniboss, {}, roster)).toEqual(roster.miniboss[0]);
            expect(resolveMob('cleaning', chest, {}, roster)).toEqual(roster.chest[0]);
            expect(resolveMob('cleaning', Object.keys(CHEST_BLOCKS)[4], {}, roster)).toEqual(roster.chest[4]);
        });

        it('starts again from the first mob when the game has more mobs than the roster', () => {
            const short = {
                hostile: [
                    { name: 'A', src: 'a.png' },
                    { name: 'B', src: 'b.png' },
                ],
            };
            expect(resolveMob('math', hostiles[2], {}, short)).toEqual({ name: 'A', src: 'a.png' });
            expect(resolveMob('math', hostiles[3], {}, short)).toEqual({ name: 'B', src: 'b.png' });
        });

        it('keeps the original mob when the roster has none of that kind or no roster is given', () => {
            expect(resolveMob('math', boss, {}, { hostile: roster.hostile }).src).toBe(BOSS_MOBS[boss]);
            expect(resolveMob('cleaning', chest, {}, { hostile: roster.hostile }).src).toBe(CHEST_BLOCKS[chest]);
            expect(resolveMob('math', hostile, {}, undefined).src).toBe(HOSTILE_MOBS[hostile]);
        });

        it('shows the picture of the theme for memory, the farm without one, and the zombie for an unknown mob', () => {
            expect(resolveMob('memory', 'Cow', {}, roster)).toEqual(roster.memory[0]);
            expect(resolveMob('memory', 'Cow', {}, { hostile: roster.hostile }).src).toBe(
                'assets/skills/farm_icon.png',
            );
            expect(resolveMob('reading', 'Nope', {}, roster).name).toBe('Zombie');
        });
    });
});
