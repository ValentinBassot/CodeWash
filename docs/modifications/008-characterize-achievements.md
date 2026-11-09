# 008 - Characterization tests of the achievements

- **Date:** 2026-11-07
- **Commit(s):** `test: characterize achievements`
- **Debt item:** D01 (pins D22, D25)

## What

`src/utils/achievementUtils.test.js`: 30 tests freezing how achievements unlock: default stats, every one-time achievement and its threshold, tiers of Ghost Buster, Power Overwhelming and Jack of All Trades, progress percentage, next tier, display names, what changes between two states (for the toasts), login days.

## Why

Achievements depend on almost every system of the game (combats, themes, deaths, skills). They must not change silently when the game is refactored. Two bugs are pinned as `KNOWN DEBT`: D25 (with no skill at all, Jack of All Trades reaches its top tier, because `Math.min()` of nothing is `Infinity`) and D22 (the login day is the UTC day).

## Proof

- `npm test`: 75 tests pass. `achievementUtils.js` and `achievements.js`: 100 % of lines.
- Mutation check by hand: 7 small changes to `achievementUtils.js` (`>=` → `>`, `floor` → `ceil`, a removed condition...). The first run let 3 survive; tests were added until every mutant made a test fail.
