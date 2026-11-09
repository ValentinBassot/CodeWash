# 022 - Characterization tests of navigation, drawers and difficulty

- **Date:** 2026-11-09
- **Commit(s):** `test: characterize navigation, drawers, volume and difficulty`
- **Debt item:** D01 (pins D37)

## What

- `src/App.navigation.test.jsx`: 11 tests: the carousel (seven cards, arrows, swipe of 100 px or more), the settings, cosmetics and achievements drawers with the overlay that closes them, the music and effects volume sliders, the bug report button, the difficulty picker (hidden before the first boss, then changes the difficulty and the mob health).
- `src/App.writing.test.jsx`: a two-word item (`IRON GOLEM`) leaves a gap between the words and is spelled without the space.
- Coverage floors raised to 86 % of lines.

## Why

These interactions were never run by a test. The diff coverage check (024) showed them as uncovered lines of this branch. D37 is pinned: the bug button opens a modal that only says "Whoa... That sucks..." with nothing to fill in.

## Proof

`npm run test:coverage`: 199 tests pass, global coverage 88.5 % of lines.
