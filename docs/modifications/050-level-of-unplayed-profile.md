# 050 - A profile never played shows the level of a new game

- **Date:** 2026-11-12
- **Commit(s):** `fix(profiles): show the new-game level for a profile never played`
- **Debt item:** D53 (found by opening the settings in the real game)

## What

- `NEW_GAME_SUMMARY` in `src/persistence/profileSave.js`: total level 6, highest level 1.
- `App.getProfileStats` returns it for a profile without a save, instead of `null`.

## Why

In the settings, the current profile of a new player showed "LV. 6" and the two others "LV. 0". Switching to one of them made it jump to 6 without playing. A new game has six skills at level 1, so every unplayed profile is at 6.

## Found on the way

Playing the real game also showed accessibility gaps (D54: buttons without a name, images without `alt`, Escape not closing the drawers) and a tab title that is the package name (D55).

## Proof

- 1 App test written first and seen failing (`0` instead of `6`), 1 unit test tying the summary to freshly built skills.
- Whole suite passes.
