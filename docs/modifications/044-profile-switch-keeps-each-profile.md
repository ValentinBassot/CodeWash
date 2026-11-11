# 044 - Switching profile keeps each profile's stats and border

- **Date:** 2026-11-11
- **Commit(s):** `fix(profiles): load the stats and border of the new profile on switch`
- **Debt item:** D49

## What

- `loadProfile(profileId)` now also returns the border effect and color of the profile.
- `handleSwitchProfile` sets the stats and the border of the new profile, not only its skills and theme.

## Why

Stats and border were read once at startup. After a switch, the save effects wrote the previous profile's values under the new profile's keys: player 2 showed the 42 mobs of player 1 instead of their own 3, and the border of player 1 replaced the one of player 2.

## Proof

- 2 App tests written first and seen failing: after a switch, each profile keeps its own stats, and its own border effect and color.
- Whole suite passes.
