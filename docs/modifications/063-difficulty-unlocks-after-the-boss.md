# 063 - A difficulty unlocks after its boss is beaten

- **Date:** 2026-11-12
- **Commit(s):** `fix(battle): unlock a difficulty only after its boss is beaten`
- **Debt item:** D50

## Decision

Difficulty 2 opens at level 21, once the level-20 boss is beaten, and so on every 20 levels (option A, chosen by the product owner on 2026-11-12).

## What

- The difficulty picker uses `getExpectedDifficulty(level)`, the rule the XP calculation already used. The second rule (`level / 20`) is gone from `App.jsx`.
- The maximum difficulty is written once, `MAX_DIFFICULTY` in `gameUtils.js`.

## Why

The picker opened difficulty 2 at level 20, one level before the XP rule expected it. A player could fight the level-20 boss on difficulty 2 and gain three levels at once.

## Found on the way

`recoveryDifficulty` is computed at each death and saved, but nothing reads it (D61, P3).

## Proof

- 1 App test written first and seen failing: the picker is still hidden at level 20. 1 more for the next boss: at level 41 the picker goes up to difficulty 3.
- Whole suite passes.
