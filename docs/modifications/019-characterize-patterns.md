# 019 - Characterization tests of the patterns game

- **Date:** 2026-11-08
- **Commit(s):** `test: characterize the patterns game`
- **Debt item:** D01 (pins D24)

## What

`src/App.patterns.test.jsx`: 7 tests that play the Simon game the way a player does: watch which axolotl lights up, then click them in the same order:
- difficulty 1 uses 2 axolotls and starts with a sequence of 1, difficulty 7 uses all 8;
- each repeated sequence grows by one axolotl, keeping the previous ones;
- five rounds defeat the mob;
- clicks during the sequence are ignored; a wrong axolotl ends the game at no cost, Retry starts again from round 0.

Coverage floors raised to 78 % of lines.

## Why

Patterns is the last mini-game of `SkillCard` (D27); with it every mini-game is pinned and `SkillCard.jsx` is at 90.9 % of lines. D24 is now a fact: `SkillCard` sends a progressive damage with each round (`onMathSubmit('WIN', damage)`), but `App` passes only the first argument to `handleSuccessHit`, so every round deals the standard 12 damage.

## Proof

- `npm run test:coverage`: 173 tests pass twice in a row, global coverage 80.1 % of lines.
- Watching the sequence step by step is slow under coverage: the watcher uses one DOM query per 50 ms of simulated time (the shortest pause between two lights is 100 ms), otherwise the five-round test went over the 20 s timeout.
- Mutation check by hand: clicks accepted during the sequence, a sequence that does not grow, always 2 axolotls, and a wrong click that does not end the game each make a test fail.
