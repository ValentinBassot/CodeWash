# 007 - Coverage and characterization tests of the game rules

- **Date:** 2026-11-07
- **Commit(s):** `test: characterize game rules in gameUtils`
- **Debt item:** D01 (pins D20)

## What

- `@vitest/coverage-v8` 5.1.0, `npm run test:coverage` (text, HTML, lcov reports in `coverage/`) and `npm run test:watch`.
- `src/utils/gameUtils.test.js`: 35 tests freezing the current rules: encounter cycle (boss every 20 levels, miniboss every 10), mob choice per skill, damage and mob health (always 5 hits), expected difficulty, XP rewards and XP to level, reading words, math problems, writing words.
- `Math.random` is controlled in the tests with `vi.spyOn`, so every result is predictable.

## Why

No refactoring without tests (subject). `gameUtils.js` holds the progression rules that every mini-game depends on. The tests describe what the code does today, bugs included: D20 (subtraction can ask `0 - 1 = -1` at difficulty 3, because the range starts at 0) is pinned by a test named `KNOWN DEBT D20`.

## Proof

`npm run test:coverage`: 45 tests pass, `gameUtils.js` at 82.5 % of lines. The uncovered part is mostly `getItemsForLength`, which nothing calls (D13).
