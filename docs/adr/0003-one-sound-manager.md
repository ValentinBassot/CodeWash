# 0003 - Every sound goes through the sound manager

- **Date:** 2026-11-10
- **Status:** Accepted
- **Debt item:** D18

## Context

Audio was created in 11 places: 5 in `soundManager.js` and 6 directly in `SkillCard.jsx` (memory, patterns, axolotl notes, wrong answers), each time with the same three lines (create, set the volume, play and ignore errors).

## Decision

`src/utils/soundManager.js` is the only module that creates audio, through a replaceable factory (`setAudioFactory`, `resetAudioFactory`), as for randomness ([0001](0001-replaceable-random-source.md)) and time ([0002](0002-replaceable-clock.md)). `playSfx(path, onError)` plays an effect at the effects volume. Game components call named functions (`playMatch`, `playMismatch`, `playAxolotlNote`, `playClick`...). ESLint forbids `new Audio` outside the sound manager.

## Consequences

- One place to change when sounds become theme-dependent (D34) or when files move (D30).
- Tests can observe every sound with a fake factory, without stubbing the global `Audio`.
- Errors are still ignored by default (D28); `playSfx` takes an `onError` callback where a fallback exists (axolotl note → click).
