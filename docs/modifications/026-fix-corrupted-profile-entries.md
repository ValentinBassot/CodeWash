# 026 - A corrupted profile entry no longer crashes the game

- **Date:** 2026-11-09
- **Commit(s):** `fix(persistence): fall back to defaults when profile entries are corrupted`
- **Debt item:** D14

## What

- `readObject(storage, key, fallback)` in `src/persistence/profileStorage.js`: reads a key, parses it once and returns a copy of the fallback when the entry is missing, not JSON, or not an object.
- `App.jsx` uses it for `heroProfileNames_v1` and `heroParentStatus_v1`, at startup and in the reset. Default names and parent status are defined once (`DEFAULT_PROFILE_NAMES`, `DEFAULT_PARENT_STATUS`).

## Why

`JSON.parse` was called on these entries without protection: a corrupted value (a crash during a write, a manual edit) threw at the very first render and the game never started. The data is now checked where it enters, and the rest of `App` can trust it.

## Proof

- The `KNOWN DEBT D14` test (crash expected) is replaced by 5 tests of the expected behavior, written first and seen failing: corrupted or non-object names and parent status start the game with the defaults and repair the entry, and the progress saved under the other keys is kept.
- `src/persistence/profileStorage.test.js`: 6 new tests for `readObject`.
- Whole suite and gate pass.
