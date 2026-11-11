# 042 - Skills are built from a save outside App

- **Date:** 2026-11-11
- **Commit(s):** `refactor(persistence): build skills from a save outside App`
- **Debt item:** D15, D26 (and D13 for one unused variable)

## What

- `src/persistence/profileSave.js`: `createNewSkill(skillId)` (a starting skill), `buildSkills(savedSkills)` (every skill of the game, merged with what is saved and repaired for old saves) and `summarizeSkills(skills)` (total and highest level).
- `App.loadSkills` only reads and parses the save, then calls `buildSkills`. `getProfileStats` uses `summarizeSkills` instead of two copies of the same loop, and loses a variable it computed and never used.
- `App.jsx` shrinks by 123 lines (1671 → 1548).

## Why

The 110-line repair of old saves lived inside the `App` component and could only be tested by mounting the whole game. As a pure module it is tested directly, and phase 3 has less to move out of `App`.

## Proof

- `src/persistence/profileSave.test.js`: 10 tests written first and seen failing (starting skill, mobs and auras per game, every skill created, old save filled, mob health rebuilt or kept, repaired fields, miniboss and boss refilled only for battle skills, unknown entries kept, level summary).
- The random draws happen in the same order as before, so the seeded game tests draw the same creatures.
- No behavior change: the save-format tests (010) and the whole suite pass, 264 tests.
