# 060 - Challenges, auras and difficulty changes are computed outside App

- **Date:** 2026-11-12
- **Commit(s):** `refactor(battle): build challenges, auras and difficulty changes outside App`
- **Debt item:** D26 (sixth step)

## What

- `src/domain/challenge.js`: `generateChallenge(type, difficulty)` builds the question of a battle for each game.
- `src/domain/battle.js`:
  - `getAuraForSkill(skillId, skill)`: the aura shown around the mob, the miniboss or the boss.
  - `withDifficulty(skill, difficulty)`: the skill at a new difficulty, with a full-health mob.
- `App` calls them. `App.jsx` goes from 1048 to 969 lines.

## Why

These three rules read no state of `App` except their arguments. Inside the component they could only be tested through the whole game.

## Proof

- The existing tests pass without any change.
- 9 unit tests: 5 for the challenges, 3 for the auras, 1 for the difficulty change.
