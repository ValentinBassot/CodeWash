# 093 - The word can be typed when the speech does not work

- **Date:** 2026-11-16
- **Commit(s):** `feat(reading): let the player type the word when the speech service fails`
- **Debt item:** none (reported by the user)

## What

- When the browser has no speech recognition, or its service fails (service unreachable, not allowed, no microphone, microphone refused), a box to type the word appears under the microphone button in the reading battle.
- A typed word is judged like a spoken one: right gives a hit, a wrong word of two letters or more costs a heart (or heals the boss), a single letter counts for nothing.
- `useVoiceListener` gives `hasFailed`, true after an error of the service and false once it listens again.

## Why

In the Electron app the message "Speech service unreachable" appeared and the reading battle could only be won with the "Skip / Manual Success" link. The speech recognition of Chromium sends the sound to an online service of Google that needs a key which Electron does not have. The app cannot repair that, so reading must stay playable without it.

## Limit

The speech works in Chrome and Edge. In Electron it stays unreachable; the typed word is the way to play reading there. An offline engine (Whisper, Vosk) would give speech in Electron too, but it is a large addition and was not done.

## Proof

- Chromium with a speech engine that fails with a network error: the message is shown, the box appears, typing "red" gives 12 damage.
- 11 new tests (hook, component, battle body, App). 584 tests pass.
