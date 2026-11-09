# 011 - Characterization tests of the sound manager

- **Date:** 2026-11-07
- **Commit(s):** `test: characterize the sound manager`
- **Debt item:** D01 (pins D30)

## What

- `src/utils/soundManager.test.js`: 23 tests with a fake `Audio` that records which file is played and at what volume: every UI sound, the effects volume, mob hurt, death and say sounds, which fighting mobs have no sound, background music (random track, next track when one ends, pause, resume, volume).
- ESLint no longer analyzes the generated `coverage/` folder.
- Coverage floors raised (52 % of lines) and a threshold for `soundManager.js` (100 % of lines).

## Why

Sound is an I/O mixed with game logic (D18). These tests freeze what is played today before it is moved behind an injectable interface. They also prove D30: none of the 8 UI sounds and none of the mob sounds exists where the code looks for it, because the files sit in `ui/ui/` and `mob/mob/`. Bogged, Breeze, Herobrine and Parched have no sound mapping at all.

## Proof

- `npm run test:coverage`: 110 tests pass, `soundManager.js` at 100 % of lines, global 52.3 %.
- Mutation check by hand: 6 changes, 5 killed. The survivor removes `this.audio.volume = this.volume` in `playNextTrack`, which changes nothing because the volume is already set on the same audio object: that line is redundant.
