# 058 - Loading and summarizing a profile leave App

- **Date:** 2026-11-12
- **Commit(s):** `refactor(profiles): load and summarize a profile outside App`
- **Debt item:** D26 (fourth step)

## What

- `src/persistence/profiles.js`:
  - `loadProfile(storage, profileId)`: the skills, theme, stats and border of a profile, a new game when nothing is saved or when the save is corrupted.
  - `summarizeSavedProfile(storage, profileId)`: the total and highest level shown on a profile card.
- `App` calls them with the browser storage. `App.jsx` goes from 1125 to 1091 lines.

## Why

Both functions only read the save, yet they lived inside `App` and could only be tested by mounting the whole game.

## Proof

- The existing tests pass without any change.
- 6 unit tests on an in-memory storage, one of them pinning the rest of D28 (a corrupted save still gives a new game with a warning).
