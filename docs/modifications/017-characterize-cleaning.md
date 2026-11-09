# 017 - Characterization tests of cleaning and the manual success button

- **Date:** 2026-11-08
- **Commit(s):** `test: characterize cleaning and the manual success button`
- **Debt item:** D01 (pins D41, adds and pins D45)

## What

`src/App.cleaning.test.jsx`: 5 tests played through the interface:
- cleaning: Complete! opens the parental check; a wrong answer is refused and counts nothing; the right answer opens the chest in one go (one level, one mob defeated); cleaning never raises its difficulty nor awards a badge, even past level 20;
- the "Skip / Manual Success" button of a reading battle.

## Why

Cleaning is another mini-game of `SkillCard` (D27), validated by a parent. Two items become facts:
- D41: the parental check is one fixed answer (`FLOPPY DISK`, any case, spaces ignored) for every family.
- D45 (new): a "Skip / Manual Success" button is shown to the player during reading battles; five clicks win the fight without reading a word.

## Proof

- `npm run test:coverage`: 160 tests pass, global coverage 74.2 % of lines; floors raised to 72 %.
- Mutation check by hand: letting cleaning raise its difficulty breaks the level 20 test; disconnecting the skip button breaks the D45 test.
