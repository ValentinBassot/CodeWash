# 020 - Characterization tests of profiles, themes, parent mode and reset

- **Date:** 2026-11-08
- **Commit(s):** `test: characterize profiles, themes, parent mode and reset`
- **Debt item:** D01 (prepares D26, D15; parent mode also uses the fixed answer of D41)

## What

`src/App.flows.test.jsx`: 7 tests that use the drawers and modals of `App` through the interface:
- themes: picking another theme saves it and counts one theme change; the active theme cannot be picked again;
- profiles: switching opens a fresh save and keeps the first one; the current profile can be renamed;
- parent mode: after the parental check (`FLOPPY DISK`, see D41), every skill jumps to level 200, difficulty 7, with all 8 badges;
- reset: anything but `DELETE` is refused; `DELETE` erases the profile save (and the legacy `heroSkills_v23` key for profile 1), resets its name and its parent status.

Coverage floors raised to 83 % of lines.

## Why

These flows live in `App` (D26) and write the save format directly (D15). They must be pinned before persistence moves into its own module and `App` is split.

## Proof

- `npm run test:coverage`: 180 tests pass, global coverage 85.5 % of lines, `App.jsx` 81.5 %, `SkillCard.jsx` 95.2 %.
- Mutation check by hand: 5 changes (parent level, legacy key kept by the reset, theme change not counted, rename ignored, profile not switched) each make a test fail.
