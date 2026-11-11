# 046 - An invalid saved current profile opens profile 1

- **Date:** 2026-11-11
- **Commit(s):** `fix(persistence): open profile 1 when the saved current profile is invalid`
- **Debt item:** D51 (found while finishing D15)

## What

- `readCurrentProfile(storage)` in `src/persistence/profileStorage.js` returns the saved profile only if it is 1, 2 or 3, and 1 otherwise.
- `App` uses it to choose the profile at startup.

## Why

The saved value was passed to `parseInt` without a check. With `abc`, `7` or `0`, the game opened a profile that does not exist and saved it under `heroSkills_v23_pNaN`, `_p7` or `_p0`: the player saw an empty game while their real save was still there.

## Proof

- 3 App tests written first and seen failing (`abc`, `7`, `0`), plus the empty entry as a guard; 9 unit tests for `readCurrentProfile`.
- Whole suite passes.
