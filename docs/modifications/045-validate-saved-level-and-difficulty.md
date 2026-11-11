# 045 - Saved levels and difficulties are brought back in range

- **Date:** 2026-11-11
- **Commit(s):** `fix(persistence): bring a saved level and difficulty back in range`
- **Debt item:** D21

## What

- `restoreSkill` turns the saved level into a whole number of at least 1, and the saved difficulty into a whole number from 1 to 7.
- When the difficulty is corrected, the mob health is rebuilt for the new difficulty.
- `MAX_DIFFICULTY` in `gameUtils.js` replaces the `7` of `getExpectedDifficulty`.

## Why

The game itself keeps levels at 1 or more and difficulties from 1 to 7, so only a save can bring other values. The save is now the one place that checks them, instead of every game function. Before, a difficulty of 99 built a mob with 3^98 times the normal health, and a level of `"x"` stayed a text.

## Found on the way

The selector unlocks difficulty 2 at level 20, but the XP rule expects it from level 21, and the `7` is written in three places (D50, P3).

## Proof

- 10 `buildSkills` tests written first and seen failing (out-of-range, decimal and non-number values), plus 2 for what must not change: a valid skill, and a saved mob health without a difficulty.
- Mutation check: without the health rebuild on a corrected difficulty, 5 tests fail.
- Whole suite passes.
