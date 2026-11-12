# 055 - Speech recognition lives in its own hook

- **Date:** 2026-11-12
- **Commit(s):** `refactor(reading): move speech recognition out of App into a hook`
- **Debt item:** D26 (second step)

## What

- `src/hooks/useVoiceListener.js`: `useVoiceListener({ keepListening, onHeard })` returns `isListening`, `spokenText`, `clearSpokenText`, `start`, `stop` and `toggle`. It owns the recognition session, its restart, the refused microphone and the texts shown on the card.
- `App` only says when listening must go on (a reading battle is running) and what to do with a heard word (judge it and hit). `App.jsx` goes from 1291 to 1177 lines.
- The hook always calls the latest `onHeard`, so a heard word can no longer reach an old copy of the hit handler (the cause of D58).
- The debug `console.log` calls of the speech code are gone; warnings and errors stay.

## Why

Speech recognition was 120 lines in the middle of `App`, sharing four refs and two states with the battle code. It could only be tested by mounting the whole game.

## Proof

- The 340 existing tests pass without any change, the 14 reading tests included.
- 12 unit tests for the hook, with a fake recognition given through `setSpeechRecognitionProvider`.
