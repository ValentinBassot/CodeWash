# 096 - The game opens in Chrome or Edge, where voice recognition works

- **Date:** 2026-11-17
- **Commit(s):** `see git log`
- **Debt item:** D67

## What

`npm run start:browser` builds the game, serves `dist` on `http://localhost:4173` with a small Node server, and opens it as an application window of Chrome or Edge (`--app`), with its own profile so the saves and the microphone choice stay. It looks for Chrome then Edge: through `/mnt/c` from WSL, in the Program Files folders on Windows, in `/Applications` on macOS and in the PATH on Linux. When the window closes the server stops. The browser asks for the microphone itself the first time.

`npm run start:native` now picks this browser window first, because it is the only one where the player can speak. It falls back to the Windows Electron from WSL, or to Electron elsewhere, when no Chrome or Edge is found. `npm run start:windows` and `npm start` stay Electron.

## Why

The microphone was never the problem in the Electron app. A diagnostic run of the Windows Electron (39.8.5) showed that Windows allowed the microphone, the device list was complete and `getUserMedia` succeeded, but the speech recognition ended with the error `network`: Chromium inside Electron has no Google key for its speech service, so it cannot reach it. The same page in an application window of Chrome 157 on the same machine received the speech (`start`, `audiostart`, `speechstart`).

## Limits

- The Electron app still cannot recognize speech: the player types the word there (093).
- The port 4173 is fixed so the saves of the browser stay under one origin; if it is taken the command says so.
- Opened and checked on Windows with Chrome from WSL. The macOS and Linux paths are only covered by tests with fake files.

## Proof

- Diagnostic page in Electron: `getUserMedia OK`, `sr error network`. Same page in Chrome: speech started and speech detected.
- `npm run start:browser` from WSL opened `chrome.exe --user-data-dir=...\CodeWash\browser --app=http://localhost:4173/` and the server answered 200.
- 20 new tests in `scripts/run-browser.test.mjs`.
