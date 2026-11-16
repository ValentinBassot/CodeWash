# 094 - The game asks for the microphone when it opens

- **Date:** 2026-11-16
- **Commit(s):** `feat(microphone): ask for the microphone permission when the game opens`
- **Debt item:** none (reported by the user)

## What

- When the page opens, the game asks for the microphone once (`requestMicrophoneAccess` in `src/io/microphone.js`, called by `useMicrophoneAccess`), so the player is not surprised in the middle of a reading battle.
- If the microphone is refused or missing, a notice explains how to unblock it, or says that the words can be typed (`MicrophoneNotice`, shown in the notification stack).
- In the Electron app, the main process allows the microphone, audio capture and full screen, lets sounds start without a click, and asks the system for the microphone on macOS. Windows asks by itself the first time.

## Limits

- Only the microphone is asked: it is the only permission the game needs. Full screen needs a click of the player and sounds are allowed by the new Electron option.
- The Electron part was not run: only its syntax was checked. In the browser it was checked in Chromium.

## Proof

- Chromium with a fake microphone: one request when the page opens, no notice. Without microphone: one request and the notice "No microphone was found".
- 15 new tests (io, hook, notice, App). 599 tests pass.
