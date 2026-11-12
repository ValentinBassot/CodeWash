# 062 - The difficulty of a battle's questions is computed outside App

- **Date:** 2026-11-12
- **Commit(s):** `refactor(battle): compute the difficulty of a battle's questions outside App`
- **Debt item:** D26 (eighth step)

## What

- `getChallengeDifficulty(skill)` in `src/domain/battle.js`: the difficulty of the skill, one harder against a miniboss, never above the maximum.
- `App.startBattle` calls it. It uses `MAX_DIFFICULTY` instead of a `7` written by hand (one of the three places listed in D50).
- A debug `console.log` at the end of a battle is gone.

## Why

The rule "a miniboss asks harder questions" was inside the function that starts a battle and could only be tested through the whole game.

## Proof

- The existing tests pass without any change, the miniboss test of the battle suite included.
- 2 unit tests.
