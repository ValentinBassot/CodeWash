# 099 - The launchers of the browser and of the Windows Electron are tested

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none (the project requires 100 % of the added lines covered)

## What

- `openInBrowser` (`scripts/run-browser.mjs`) and `runWindows` (`scripts/run-electron-windows.mjs`) take the system as an argument: the process functions, the file functions, the download, the exit code and the log. `nodeSystem()` builds the real one and is the default, so the commands and `start:native` work as before.
- `listen`, `localAppData`, `toLinuxPath`, `toWindowsPath` and `ensureWindowsElectron` are exported functions with their own tests.
- `start:native` (`scripts/run-electron-native.mjs`) does the same: `nodeSystem()` gathers the platform, the environment and the three launchers, and the last line of the file only calls `launchNative(nodeSystem())`.
- `runWindows` prints the WSL message and calls an injected `exit` instead of `process.exit`.

## Why

Both functions started processes, copied files and downloaded Electron, so nothing could test them without launching a browser or Electron. Their lines counted as not covered in the coverage of the diff.

## Behaviour kept

Same commands, same folders (`%LOCALAPPDATA%\CodeWash`), same arguments, same exit codes.

## Limits

Only the real wiring in `nodeSystem` is checked by comparing references (`execFileSync`, `spawn`, `existsSync`): the launch itself was not repeated on Windows from here.

## Proof

- New tests: `listen` serves a folder on a real local port and rejects when the port is taken; `openInBrowser` with a fake browser; `runWindows` outside WSL, with a cached Electron, with a download and for each exit code.
- `npm run test:coverage`, `npm run lint` and `npm run format:check` pass.
