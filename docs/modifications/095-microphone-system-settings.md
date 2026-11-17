# 095 - The Electron app opens the system microphone settings when the microphone is blocked

- **Date:** 2026-11-17
- **Commit(s):** `fix(microphone): open the system microphone settings when the app cannot use it`
- **Debt item:** none (reported by the user)

## What

- In the Electron app there is no browser prompt: the game allows the microphone itself, so a refusal always comes from the system (Windows privacy settings, macOS privacy settings).
- At start, `ensureMicrophoneAccess` (`electron/microphoneSettings.cjs`) reads the system status of the microphone. If it is blocked or restricted, it opens the privacy page of the system: `ms-settings:privacy-microphone` on Windows, the Microphone privacy pane on macOS. On macOS it still asks first when the status is not determined.
- Nothing is done on Linux, where the system has no such switch.
- The notice in the game now tells to allow the microphone in the privacy settings, then to reopen the game.
- The coverage now counts `electron/*.cjs`, except `main.cjs` which only wires Electron.

## How to allow the microphone

- Windows: Settings, Privacy and security, Microphone. Turn on "Microphone access", then "Let desktop apps access your microphone". Reopen the game.
- macOS: System Settings, Privacy and Security, Microphone. Turn on the game (Electron). Reopen the game.
- Linux or WSL with `npm start`: the app runs inside WSL, which usually has no microphone. Use `npm run start:windows` to open the game in a Windows window that uses the Windows microphone.

## Limits

- The Windows and macOS calls were not run on those systems: only the decision is tested, with fake system functions.
- The speech service of Chromium stays unreachable in Electron (no Google key, see D66): the typed word remains the fallback.

## Proof

- 8 new tests for the decision (Linux, Windows granted, blocked, restricted, unknown, macOS asked, refused, blocked before). 597 tests pass.
