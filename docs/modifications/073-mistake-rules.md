# 073 - What a wrong answer does is decided outside App

- **Date:** 2026-11-15
- **Commit(s):** `refactor(battle): decide the outcome of a wrong answer outside App`
- **Debt item:** D26 (next step)

## What

- `resolveMistake(skill, playerHealth)` in `src/domain/battle.js` says what a wrong answer does: a boss heals to full, the player loses a life, or the player dies (level lost, lives refilled).
- `PLAYER_MAX_HEALTH` replaces the number 10 written in two places.
- `handleSuccessHit` of `App` is split: `handleMistake` plays the sounds and sets the states, the rules are in the domain.

## Behaviour kept

Same rules as before, including the death at the boss level handled by `afterDeath`.

## Proof

- 4 unit tests for `resolveMistake`, the existing tests pass.
