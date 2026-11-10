# 030 - Phantom spawn key in the save keys

- **Date:** 2026-11-10
- **Commit(s):** `refactor(persistence): add the phantom spawn key to the save keys`
- **Debt item:** D15

## What

`SAVE_KEYS.phantomLastSpawn` (`phantomEvent_lastSpawn_v1`) in `src/persistence/profileStorage.js`; `PhantomEvent.jsx` uses it instead of its own constant.

## Why

029 showed that the phantom writes a key of the save format that was defined apart from the others. Every key now lives in `SAVE_KEYS`, so the list of what the game stores is in one place.

## Proof

The `SAVE_KEYS` test was extended first and seen failing; the save-format, phantom and storage tests pass (32 tests).
