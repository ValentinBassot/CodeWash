# 003 - README and first launch log

- **Date:** 2026-11-05
- **Commit(s):** `815f149`
- **Debt item:** No README or launch instructions

## What

Added `README.md` (install, commands, troubleshooting, layout) and `docs/LAUNCH.md` (how the project was first launched, problems found, fixes).

## Why

The repository had no instructions: a newcomer could not install or launch the game without asking.

## Proof

Every command in the README was run on the dev machine (WSL2): `npm run doctor`, `npm ci`, `npm run dev`, `npm start`, `npm test`, `npm run lint`, `npm run build`. Not yet tried from a fresh clone or on native Windows.
