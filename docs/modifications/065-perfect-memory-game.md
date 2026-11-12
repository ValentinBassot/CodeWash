# 065 - A memory game won without a mismatch counts as perfect

- **Date:** 2026-11-13
- **Commit(s):** `fix(memory): count a memory game won without any mismatch`
- **Debt item:** D62

## What

- `MemoryGame` counts its mismatches and tells `onWin` whether the game was perfect.
- `App` adds one to `perfectMemoryGames` for a perfect game, through `recordStats`, which also announces the achievement.

## Why

The "Perfectionist" achievement asks for a memory game without any mismatch, and one border effect is unlocked by it. The stat it reads was never changed anywhere, so neither could ever be obtained.

## Proof

- 1 App test written first and seen failing (a perfect game counted 0), 1 guard: a game won after a mismatch counts nothing.
- 1 more test for the component alone.
- Whole suite passes.
