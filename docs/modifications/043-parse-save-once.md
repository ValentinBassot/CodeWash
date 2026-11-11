# 043 - The save is parsed once per profile load

- **Date:** 2026-11-11
- **Commit(s):** `refactor(persistence): parse a profile save once`
- **Debt item:** D15, D28 (first part)

## What

- `parseProfileSave(raw)` in `src/persistence/profileSave.js`: one parse giving `skills`, `theme` and `stats` (stats completed with their defaults), the old unwrapped format included; it throws on a corrupted entry.
- `App.loadProfile(profileId)` replaces `loadSkills`, `loadTheme` and `loadStats`: the save is parsed once at startup and once per profile switch, and a corrupted save gives one warning instead of three. `getProfileStats` uses the same parser.

## Why

The same entry was parsed three times in a row. For a new player, two of those parses ran on a missing save and threw `TypeError`s that were caught and logged as warnings at every first launch (D28). Those were noise that hid real errors.

## Found on the way

`handleSwitchProfile` reloads the skills and the theme of the new profile but not its stats, so the stats of the previous profile are written into the new profile's save (D49, fixed in the next commit).

## Proof

- 4 tests for `parseProfileSave` and 2 App tests written first and seen failing: a new player starts without any warning (it replaces the `KNOWN DEBT` test that expected two warnings), a corrupted save gives exactly one warning.
- Whole suite passes.
