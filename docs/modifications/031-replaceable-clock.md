# 031 - Time through one replaceable clock

- **Date:** 2026-11-10
- **Commit(s):** `refactor(domain): read the time through one replaceable clock`
- **Debt item:** D17

## What

- `src/domain/clock.js`: `now()`, `todayKey()`, `setClock()`, `resetClock()`.
- `PhantomEvent` uses `now()`; `App` and `achievementUtils` use `todayKey()` instead of two copies of the same expression.
- ESLint forbids `Date.now()` and `new Date()` without arguments in `src/` outside this module and the tests.
- ADR 0002 records the choice.

## Why

The protocol asks to inject the clock (directed jet). Reading the time in one place makes it controllable in tests and removes a duplicated rule.

## Proof

- `src/domain/clock.test.js`: 4 tests written first and seen failing, including `KNOWN DEBT D22` (UTC day) to pin the behavior kept for now.
- No behavior change: the whole suite passes (231 tests), including the phantom and login-day tests.
- A sample file with `Date.now()` and `new Date()` gets 2 lint errors.
