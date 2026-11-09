# 025 - Save keys and legacy fallback in one place

- **Date:** 2026-11-09
- **Commit(s):** `refactor(persistence): centralize save keys and the legacy fallback`
- **Debt item:** D15 (first step)

## What

- `src/persistence/profileStorage.js`: `SAVE_KEYS` names every key of the save format, `readProfileSave(storage, profileId)` reads a profile save with the fallback to the legacy `heroSkills_v23` key for profile 1.
- `App.jsx` uses them: no key name is written in `App` any more, and the fallback, copied four times (`loadSkills`, `loadTheme`, `loadStats`, `getProfileStats`), now exists once.

## Why

One decision, one place: a key name or the legacy rule changed in one copy and not in the others would corrupt saves. This is the first step of D15; reading and writing the save still happen in `App`.

## Proof

- `src/persistence/profileStorage.test.js`: 5 tests written first and seen failing (all keys, own save, legacy fallback for profile 1 only, own save preferred, empty save kept as the original code did).
- No behavior change: the 12 save-format tests (010), the flows (020) and the whole suite pass, 207 tests.
