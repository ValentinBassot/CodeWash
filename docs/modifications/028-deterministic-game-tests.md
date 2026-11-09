# 028 - Deterministic game tests

- **Date:** 2026-11-09
- **Commit(s):** `test: make game tests deterministic with a seeded random source`
- **Debt item:** D16 (consequence)

## What

- `useGameClock()` (shared by every test that mounts the App) sets a seeded random source; the test setup restores the default source after each test.
- `nextRandomValues(...)` queues exact values for the next draws, then falls back to the seeded source. The two-word writing test uses it instead of stubbing `Math.random`.
- Coverage floors set right under the measure, without the 1 to 2 point margin kept since 013: 88 % of lines.

## Why

With the random source replaceable (027), a game mounted in a test can draw the same mobs, words and sequences every time. Before, coverage moved by about one point between runs, so the floors had to stay below the measure and a small drop could go unnoticed.

## Proof

- Three runs of `npm run test:coverage` in a row give exactly the same totals: 1648/1857 lines, 1778/2017 statements, 365/439 functions, 1124/1393 branches.
- The 76 App tests and the whole suite pass.
