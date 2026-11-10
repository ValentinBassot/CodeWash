# 0002 - Time is read through one replaceable clock

- **Date:** 2026-11-10
- **Status:** Accepted
- **Debt item:** D17

## Context

The game read the time in four places: `Date.now()` twice in the phantom event, and the same "today as YYYY-MM-DD" expression copied in `App.jsx` and in `achievementUtils.js`. Timers (`setTimeout`, `setInterval`) are the other half of the clock; tests already control them with Vitest fake timers.

## Decision

Same approach as [0001](0001-replaceable-random-source.md): `src/domain/clock.js` exposes `now()` and `todayKey()`, with `setClock(fn)` and `resetClock()`. ESLint forbids `Date.now()` and `new Date()` without arguments in `src/` outside this module and the tests. Timers stay as they are and are controlled by fake timers in tests.

## Consequences

- The game behaves as before; `todayKey()` returned the UTC day (D22) until 032, which made it the local day.
- The "today" rule exists once instead of twice.
- A test can set the time without faking timers, or fake timers and the clock follows, because the default clock reads `Date.now()` at call time.
