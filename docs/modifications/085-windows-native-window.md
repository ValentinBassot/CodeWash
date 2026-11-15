# 085 - The game opens in a native window on Windows, macOS and Linux

- **Date:** 2026-11-15
- **Commit(s):** `see git log`
- **Debt item:** none

## What

`npm run start:native` picks the right way to open the game: from WSL it does what `start:windows` does, and on macOS, Linux and Windows it starts the desktop app like `npm start`. The pick is the function `pickLauncher`, tested for each platform.

`npm run start:windows` builds the game, downloads the Windows Electron once into `%LOCALAPPDATA%\CodeWash`, copies the build and the Electron main process files (`ELECTRON_FILES`) there and starts `electron.exe`. The Windows microphone settings page opens by itself when Windows blocks the microphone (095).

## Why

`npm start` under WSL runs the Linux Electron through WSLg, whose window glitches. A Windows `electron.exe` gives a normal native window.

## Proof

`npm run start:windows` opened `electron.exe` processes visible in the Windows task list. `scripts/run-electron-windows.test.mjs` covers WSL detection and the app manifest. `scripts/run-electron-native.test.mjs` covers the choice of launcher for WSL, macOS, Linux and Windows. It was run on WSL only: the macOS and plain Linux paths are the existing `npm start`, not tried on those systems.
