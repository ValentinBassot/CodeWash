# 0004 - Browser APIs live behind src/io

- **Date:** 2026-11-10
- **Status:** Accepted
- **Debt item:** D19

## Context

`App` used `window.webkitSpeechRecognition` directly in four places. The game logic (when a spoken word is right, what happens on a hit) and the browser API were mixed in the same 90-line function.

## Decision

Browser APIs that are not part of React get a small module in `src/io/` with a replaceable provider, following the same pattern as randomness, time and sound ([0001](0001-replaceable-random-source.md), [0002](0002-replaceable-clock.md), [0003](0003-one-sound-manager.md)). The first one is `src/io/speechRecognition.js` (`isSpeechRecognitionAvailable`, `createSpeechRecognition`, `setSpeechRecognitionProvider`). The rules of the game that used to sit next to the API go to `src/domain/` (`src/domain/reading.js` for judging a spoken word). ESLint forbids `webkitSpeechRecognition` outside `src/io/`.

## Consequences

- `src/domain/` holds pure game rules, `src/io/` holds what talks to the browser; `App` and `SkillCard` wire them together until phase 3 splits them.
- Storage could follow the same path; `src/persistence/` already plays that role for `localStorage`.
- The auto-restart logic of the microphone still lives in `App`, with its bug (D31).
