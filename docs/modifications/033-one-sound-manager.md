# 033 - Every sound through the sound manager

- **Date:** 2026-11-10
- **Commit(s):** `refactor(sound): create every sound in the sound manager`
- **Debt item:** D18 (and refines D32)

## What

- `soundManager.js` creates audio through a replaceable factory (`setAudioFactory`, `resetAudioFactory`) and plays effects with `playSfx(path, onError)`. New functions: `playMatch`, `playMismatch`, `playAxolotlNote` (the note table moved from `SkillCard`).
- `SkillCard.jsx` no longer creates audio: its note table, its two sound helpers and four inline blocks are replaced by these functions.
- ESLint forbids `new Audio` outside the sound manager. ADR 0003 records the choice.

## Why

The same three lines were copied in 9 places, 6 of them inside the game component. Sound is an I/O; keeping it in one module makes it observable in tests and changeable in one place for the themes mission (D34).

## Found on the way

`playMismatch` also plays on every wrong math and writing answer, and its file does not exist (D32): D32 affects four mini-games, not two. The register is updated.

## Proof

- 6 new tests in `soundManager.test.js`, written first and seen failing: factory replaced and restored, `playSfx` at the effects volume, `onError` when playing fails, match and mismatch files, each axolotl note and the click for an unknown one, click fallback when a note fails.
- No behavior change in the game: whole suite passes (238 tests), including the memory and patterns games.
- A sample file with `new Audio` outside the sound manager gets a lint error.
