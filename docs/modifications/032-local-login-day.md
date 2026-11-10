# 032 - Login days are counted in local time

- **Date:** 2026-11-10
- **Commit(s):** `fix(domain): count login days in local time`
- **Debt item:** D22

## What

- `todayKey()` returns the local day (`YYYY-MM-DD` from the local date) instead of the UTC day.
- Tests run in the `Europe/Paris` time zone (`env.TZ` in `vite.config.js`), so the result does not depend on the machine.

## Why

The login days feed the "Dedicated" achievement (three different days). With the UTC day, a child playing at 00:30 in Paris was counted on the day before, and two sessions on either side of 01:00 counted as one day. Since 031 the rule exists in one place, so the fix is one function.

## Proof

- The two `KNOWN DEBT D22` tests (clock and achievements) were turned into tests of the local day and seen failing first: 23:30 UTC on the 12th is the 13th in Paris. A test checks the zero padding.
- Whole suite passes (232 tests).
