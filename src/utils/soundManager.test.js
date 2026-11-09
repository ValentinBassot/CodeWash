import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOSS_MOBS, HOSTILE_MOBS, MINIBOSS_MOBS } from '../constants/gameData';

class FakeAudio {
    static created = [];
    constructor(src) {
        this.src = src;
        this.volume = 1;
        this.plays = 0;
        this.paused = false;
        this.listeners = {};
        FakeAudio.created.push(this);
    }
    play() {
        this.plays += 1;
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
    addEventListener(event, handler) {
        this.listeners[event] = handler;
    }
}

let sound;
const lastSrc = () => FakeAudio.created.at(-1)?.src;
const onDisk = (src) => existsSync(resolve('public', src));

beforeEach(async () => {
    FakeAudio.created = [];
    vi.stubGlobal('Audio', FakeAudio);
    vi.resetModules();
    sound = await import('./soundManager');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('UI sounds', () => {
    it.each([
        ['playActionCardLeft', 'assets/sounds/ui/actioncard_left.wav'],
        ['playActionCardRight', 'assets/sounds/ui/actioncard_right.wav'],
        ['playClick', 'assets/sounds/ui/click.wav'],
        ['playDeath', 'assets/sounds/ui/death.wav'],
        ['playFail', 'assets/sounds/ui/fail.wav'],
        ['playLevelUp', 'assets/sounds/ui/levelup.wav'],
        ['playNotification', 'assets/sounds/ui/notification.wav'],
        ['playSuccessfulHit', 'assets/sounds/ui/successful_hit.wav'],
        ['playAchievement', 'assets/sounds/ui/notification.wav'],
    ])('%s plays %s once at the effects volume', (fn, src) => {
        sound[fn]();
        expect(FakeAudio.created).toHaveLength(1);
        expect(FakeAudio.created[0]).toMatchObject({ src, volume: 0.5, plays: 1 });
    });

    it('an unknown sound plays nothing', () => {
        sound.playUISound('nope');
        expect(FakeAudio.created).toHaveLength(0);
    });

    it('the effects volume applies to the next sounds', () => {
        sound.setSfxVolume(0.2);
        sound.playClick();
        expect(sound.getSfxVolume()).toBe(0.2);
        expect(FakeAudio.created[0].volume).toBe(0.2);
    });

    it('lists the UI sound names', () => {
        expect(sound.UI_SOUND_NAMES).toEqual([
            'actioncard_left',
            'actioncard_right',
            'click',
            'death',
            'fail',
            'levelup',
            'notification',
            'successful_hit',
        ]);
    });

    it('KNOWN DEBT D30: none of the UI sound files exists where the code looks for it', () => {
        sound.UI_SOUND_NAMES.forEach((name) => sound.playUISound(name));
        const found = FakeAudio.created.filter((a) => onDisk(a.src));
        expect(found).toEqual([]);
        expect(onDisk('assets/sounds/ui/ui/click.wav')).toBe(true);
    });
});

describe('mob sounds', () => {
    it('hurt, death and say use the mob folder', () => {
        sound.playMobHurt('Magma Cube');
        expect(lastSrc()).toBe('assets/sounds/mob/magmacube/hurt.wav');
        sound.playMobDeath('Enderman');
        expect(lastSrc()).toBe('assets/sounds/mob/endermen/death.wav');
        sound.playMobSay('Bunny');
        expect(lastSrc()).toBe('assets/sounds/mob/rabbit/say.wav');
    });

    it('a mob without a folder plays nothing', () => {
        sound.playMobHurt('Herobrine');
        sound.playMobDeath('Herobrine');
        sound.playMobSay('Herobrine');
        expect(FakeAudio.created).toHaveLength(0);
    });

    it('these fighting mobs have no sound at all', () => {
        const fighters = [...Object.keys(HOSTILE_MOBS), ...Object.keys(BOSS_MOBS), ...Object.keys(MINIBOSS_MOBS)];
        const silent = fighters.filter((mob) => {
            const before = FakeAudio.created.length;
            sound.playMobHurt(mob);
            return FakeAudio.created.length === before;
        });
        expect(silent.sort()).toEqual(['Bogged', 'Breeze', 'Herobrine', 'Parched']);
    });

    it('KNOWN DEBT D30: mob sound files sit one folder deeper than the code looks', () => {
        sound.playMobHurt('Zombie');
        expect(onDisk(lastSrc())).toBe(false);
        expect(onDisk('assets/sounds/mob/mob/zombie/hurt.wav')).toBe(true);
    });
});

describe('background music', () => {
    it('is a single shared manager', () => {
        expect(sound.getBGMManager()).toBe(sound.getBGMManager());
    });

    it('starts a random track at volume 0.3, and the files exist', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const bgm = sound.getBGMManager();
        bgm.play();
        expect(FakeAudio.created).toHaveLength(1);
        expect(FakeAudio.created[0]).toMatchObject({ src: 'assets/sounds/bgm/calm1.wav', volume: 0.3, plays: 1 });
        expect(onDisk(FakeAudio.created[0].src)).toBe(true);
        expect(bgm.isPlaying).toBe(true);
    });

    it('moves to a different track when one ends', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const bgm = sound.getBGMManager();
        bgm.play();
        FakeAudio.created[0].listeners.ended();
        expect(FakeAudio.created[0].src).toBe('assets/sounds/bgm/calm2.wav');
        expect(FakeAudio.created[0].plays).toBe(2);
        expect(FakeAudio.created).toHaveLength(1);
    });

    it('toggle pauses and resumes the same audio, volume changes apply at once', () => {
        const bgm = sound.getBGMManager();
        bgm.play();
        bgm.toggle();
        expect(bgm.isPlaying).toBe(false);
        expect(FakeAudio.created[0].paused).toBe(true);
        bgm.toggle();
        expect(bgm.isPlaying).toBe(true);
        expect(FakeAudio.created).toHaveLength(1);
        bgm.setVolume(0.8);
        expect(FakeAudio.created[0].volume).toBe(0.8);
    });

    it('pausing or changing volume before any music started does nothing', () => {
        const bgm = sound.getBGMManager();
        bgm.pause();
        bgm.setVolume(0.1);
        bgm.playNextTrack();
        expect(FakeAudio.created).toHaveLength(0);
        expect(bgm.volume).toBe(0.1);
    });

    it('with a single track, keeps playing it', () => {
        const bgm = sound.getBGMManager();
        bgm.tracks = ['only.wav'];
        expect(bgm.getRandomTrack()).toBe(0);
        bgm.currentTrackIndex = 0;
        expect(bgm.getRandomTrack()).toBe(0);
    });
});
