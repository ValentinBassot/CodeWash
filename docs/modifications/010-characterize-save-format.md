# 010 - Characterization tests of the save format

- **Date:** 2026-11-07
- **Commit(s):** `test: characterize the save format`
- **Debt item:** D01 (pins D14, D28, adds and pins D44)

## What

- `src/App.persistence.test.jsx`: 12 tests that mount the real `App` and read `localStorage`: the 6 keys written for a new player, their default values, the shape of a profile save (`skills`, `theme`, `stats`) and of a skill record, a save loaded and written back unchanged, profile selection, migration of the legacy `heroSkills_v23` key and of the old unwrapped format.
- Test environment: jsdom and Testing Library (`src/test/setup.js` stubs audio playback, which jsdom does not have, and clears `localStorage` after each test).
- Coverage floors raised to the new level (49 % of lines).

## Why

The save format is the public contract of the game: players' progress lives in it, and the refactoring of the persistence (D15) must not break it. Three bugs are pinned as `KNOWN DEBT`:
- D14: a corrupted `heroProfileNames_v1` crashes the game at startup.
- D28: a corrupted skills save is silently replaced by a new game, and a new player triggers two swallowed errors.
- D44 (new): an old save without mob health gets a 60 HP mob even at difficulty 2, because defaults are merged before the backfill check.

## Proof

- `npm run test:coverage`: 87 tests pass, global coverage 49.6 % of lines (was 16 %), gate passes.
- Mutation check: removing the read of the legacy key makes the migration test fail.
