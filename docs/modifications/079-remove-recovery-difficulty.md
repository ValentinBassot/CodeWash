# 079 - recoveryDifficulty is removed

- **Date:** 2026-11-15
- **Commit(s):** `refactor(battle): remove recoveryDifficulty that nothing reads`
- **Debt item:** D61

## What

- The field `recoveryDifficulty` is no longer created, computed at a death, reset at a victory, repaired at load or saved.
- The tests that checked it are updated.

## Why

It was computed and saved in every skill, but no rule, screen or test outside its own checks ever read it.

## Behaviour kept

Levels, deaths, restored levels and difficulties are the same. An old save that still holds the field keeps working: the field is ignored.

## Proof

- 527 tests pass.
