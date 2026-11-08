# 018 - Characterization tests of the memory game

- **Date:** 2026-11-08
- **Commit(s):** `test: characterize the memory game`
- **Debt item:** D01

## What

`src/App.memory.test.jsx`: 6 tests that play the memory game by clicking the cards and reading their faces, the way a player remembers them:
- difficulty 1 deals 3 pairs face down, difficulty 7 deals 10 pairs;
- a matched pair leaves the board, a mismatch flips both cards back at no cost, clicking the same card twice is not a pair;
- matching every pair wins: one level, one mob defeated, the board closes.

Coverage floors raised to 74 % of lines.

## Why

Memory is another mini-game living in `SkillCard` (D27), with its own timing (300 ms to check a pair, 500 ms before the win). It must be pinned before `SkillCard` is split.

## Proof

- `npm run test:coverage`: 166 tests pass, global coverage 76.1 % of lines, memory tests stable over 2 runs.
- Mutation check by hand: never winning, allowing the same card twice, and always dealing 3 pairs each make a test fail. Two assertions that proved nothing (`memoryMob` is "some string") were removed first.
