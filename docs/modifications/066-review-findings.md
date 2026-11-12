# 066 - Fixes found by an independent review of the unmerged work

- **Date:** 2026-11-13
- **Commit(s):** `fix(battle): fix the defects found by the review of the extractions`
- **Debt item:** D63

## What

- `afterDeath(skill)` in `src/domain/battle.js`: dying costs a level, and when the new level unlocks less difficulty than the skill is on, the difficulty comes down with it and the mob is rebuilt. Before, a death from level 21 (difficulty 2) left the player at the level-20 boss on difficulty 2.
- The difficulty picker stays visible while the difficulty is above what the level unlocks, so a save made before the new unlock rule can still lower it.
- `useAchievementToast` keeps a queue: two achievements announced together are shown one after the other, each for 6 seconds, and the timer is cleared.
- `recordStats` keeps the latest stats in the ref, so two stat changes in the same tick build on each other.
- `MemoryGame` cancels its timers when it leaves, so a win cannot be credited after the battle was ended.

## Why

A review agent read the 8 unmerged commits and reported four defects, each with a scenario. All four were confirmed by reading the code and each now has a test written first.

## Proof

- 9 tests written first and seen failing: 4 for `afterDeath`, 1 for the picker, 2 for the toast queue and timer, 1 for leaving the memory game, 1 for a first perfect game that is also a first victory (both toasts shown in turn).
- Whole suite passes.
