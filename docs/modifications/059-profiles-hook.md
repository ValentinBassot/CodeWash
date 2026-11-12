# 059 - The profiles and their save live in a hook

- **Date:** 2026-11-12
- **Commit(s):** `refactor(profiles): move the profile state and its save out of App into a hook`
- **Debt item:** D26 (fifth step)

## What

- `src/hooks/useProfiles.js`: `useProfiles(storage)` owns the current profile, the names, the parent status, the skills, the stats, the theme and the border. It saves them at every change and gives `switchProfile`, `renameProfile`, `setParentVerified` and `resetCurrentProfile`.
- `src/domain/parent.js`: `grantParentPrivileges(skills)` puts every skill at level 200, difficulty 7, with all badges.
- `App` loses nine states and two effects. `App.jsx` goes from 1091 to 1048 lines.

## Why

`App` held the whole saved state and the code that writes it. The hook takes the storage as an argument, so the save of a profile is tested on an in-memory object, without the game.

## Proof

- The 369 existing tests pass without any change: the save format, the profile switch, the parent mode and the reset behave the same.
- 7 unit tests for the hook, 2 for the parent privileges.
