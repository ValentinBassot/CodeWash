# 012 - Characterization tests of the game data

- **Date:** 2026-11-07
- **Commit(s):** `test: characterize game data and asset files`
- **Debt item:** D01 (pins D32, D33, D42)

## What

`src/constants/gameData.test.js`: 16 tests on the data every mini-game reads: six skills, four themes (picker and configuration in sync), number of creatures, writing pools, display names, mob auras, and a check that every image file referenced by the data exists in `public/`.

## Why

The data and the asset files are shared by every mini-game and will move with the themes mission. The file check turns three items of the register into facts:
- D32: the 10 sounds of `BASE_ASSETS.audio` (memory and patterns games) do not exist.
- D33: 4 theme images are missing (`kpop_memorycard.jpg`, `pokemon_memorycard.jpg`, `spy_logo.png`, `spy_memorycard.jpg`).
- D42: the 8-letter reading list holds `CROCODILE` (9 letters) and `I LOVE MOM`.
Every other referenced image exists (mobs, chests, skills, difficulties, writing pictures, theme thumbnails).

## Proof

`npm run test:coverage`: 126 tests pass, `gameData.jsx` and `mobDisplayUtils.js` at 100 % of lines, gate passes.
