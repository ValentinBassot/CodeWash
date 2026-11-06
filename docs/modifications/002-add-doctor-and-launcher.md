# 002 - Environment doctor and one-command launch

- **Date:** 2026-11-05
- **Commit(s):** `409ca52`
- **Debt item:** Launch broken with npm < 10 and in VS Code terminals

## What

- `npm run doctor` (`scripts/doctor.mjs`): checks Node ≥ 20, npm ≥ 10 and `ELECTRON_RUN_AS_NODE`, and prints a fix for each problem.
- `npm start` (`scripts/run-electron.mjs`): builds, then starts Electron without `ELECTRON_RUN_AS_NODE`.
- `engines` in `package.json`, `.nvmrc` (22), Vitest and `npm test`.

## Why

- npm 9 cannot read the `npm:rolldown-vite` alias in the lockfile, and `npm ci` then claims there is no lockfile.
- VS Code terminals set `ELECTRON_RUN_AS_NODE=1`, so `electron .` crashes on `app.whenReady`.

## Proof

`npm test`: 10 tests pass. `npm run doctor` flags both problems on the dev machine. `npm start` opens the game from a VS Code terminal.
