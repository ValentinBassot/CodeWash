# 035 - Speech recognition behind src/io

- **Date:** 2026-11-10
- **Commit(s):** `refactor(io): reach speech recognition through one module`
- **Debt item:** D19

## What

- `src/io/speechRecognition.js`: `isSpeechRecognitionAvailable()`, `createSpeechRecognition()`, `setSpeechRecognitionProvider()`, `resetSpeechRecognitionProvider()`.
- `App` uses it instead of `window.webkitSpeechRecognition` (4 places).
- ESLint forbids `webkitSpeechRecognition` outside `src/io/`. ADR 0004 explains the `src/domain` / `src/io` split.

## Why

The microphone is an I/O that was wired straight into `App`. Behind one module it can be replaced in tests without stubbing a global, and phase 3 can move the reading logic out of `App` without touching the browser API.

## Proof

- `src/io/speechRecognition.test.js`: 3 tests written first and seen failing (not available without the API, browser API read at call time, provider replaced and reset).
- The reading battle tests (016), which stub the browser API, pass unchanged; whole suite passes (247 tests).
- A sample file using the API outside `src/io/` gets lint errors.
