# 061 - One way to record a stat and announce an achievement

- **Date:** 2026-11-12
- **Commit(s):** `refactor(achievements): record stats and announce achievements in one place`
- **Debt item:** D26 (seventh step), D60

## What

- `src/hooks/useAchievementToast.js`:
  - `firstNewAchievement(oldStats, newStats, oldSkills, newSkills)`: the achievement or the tier to announce, if any.
  - `useAchievementToast()` returns the `toast` to show and `announce`, which plays the sound and hides the toast after 6 seconds.
- `App.recordStats(update)` updates the stats and schedules the announcement. The five places that changed a stat (death, defeat, theme change, border change, phantom caught) call it. `App.jsx` goes from 969 to 898 lines.

## Why

The same ten lines were copied five times. Three of the copies scheduled the check from inside a `setStats` update, which React runs twice in development: the achievement sound played twice (D60, same cause as D52).

## Proof

- 1 App test under `StrictMode` written first and seen failing (2 sounds instead of 1), now passing.
- The existing tests pass without any change.
- 5 unit tests for the hook and its pure function.
- 2 App tests for picking a border, which no test covered before: an unlocked border is saved and counted once, a locked one cannot be picked.
