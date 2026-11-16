# 074 - The phantom bonus level is added by the domain

- **Date:** 2026-11-15
- **Commit(s):** `refactor(battle): add the phantom bonus level outside App`
- **Debt item:** D26 (next step)

## What

- `withPhantomLevel(skill)` in `src/domain/battle.js` returns the skill with one more level.
- `handlePhantomLevelAward` of `App` uses it instead of building the new skill by hand.

## Behaviour kept

Same level gain, same sound, same loot box.

## Proof

- 2 unit tests for `withPhantomLevel`, the existing tests pass.
