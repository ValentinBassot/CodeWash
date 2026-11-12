# 048 - The result of a hit is computed outside App

- **Date:** 2026-11-12
- **Commit(s):** `refactor(battle): compute the result of a hit outside App`
- **Debt item:** D26 (first step)

## What

- `src/domain/battle.js`:
  - `describeHit(skillId, skill)`: damage dealt, instant defeat or not, mob defeated or not.
  - `resolveHit(skillId, skill)`: the skill after the hit (health, XP, level, difficulty, badges, next mobs) and what happened (`defeated`, `levelRestored`, `leveledUp`, `newBadgeLevels`).
  - `recordDefeat(stats, defeated)`: the stats after a defeated mob, miniboss or boss.
- `App.handleSuccessHit` calls them and only plays the sounds and shows the notifications. `App.jsx` goes from 1509 to 1290 lines.

## Why

The rules of a hit were 250 lines inside a state update of `App`, mixed with sounds and notifications, and could only be tested by mounting the whole game. They are now pure functions tested in milliseconds.

## Found on the way

`App` still plays sounds and updates the stats from inside the `setSkills` update. React runs such an update twice in development (`StrictMode`), so it must not have side effects (D52, next commit).

## Proof

- The 303 existing tests pass without any change: the battle, save and achievement behaviour is the same.
- 21 unit tests for the three functions, one of them pinning D50 (the level-20 boss beaten on difficulty 2 gives three levels).
