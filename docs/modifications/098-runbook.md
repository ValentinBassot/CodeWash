# 098 - A runbook for running, repairing and restoring the game

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none (lost point of the mid-term: "No runbook")

## What

`docs/RUNBOOK.md` gathers how to run (`npm run dev`, `npm start`, `start:windows`, `start:native`, `start:browser`), build, test, what to do for each known problem (blocked microphone, the voice failing in Electron with `network`, no Chrome or Edge, port 4173 busy, `ELECTRON_RUN_AS_NODE`, old npm), how to restore a save from `heroSkills_v23_p<N>_corrupted`, and what to do when the CI fails.
The README links it, with the CI of the mirror and `QUALITY_GATES.md`.

## Why

The knowledge was spread over the README, `LAUNCH.md`, `MICROPHONE_FEATURE.md` and the notes 078, 085, 093, 095 and 096. Nobody could find "what do I do when it breaks" in one place.

## Limits

- The commands and names were checked against `package.json`, `scripts/` and `src/persistence/profileStorage.js`. The restore steps and the `lsof` and `netstat` commands were not run here.
- The corrupted backup is the raw text that failed to parse: it has to be repaired by hand before it is written back.

## Proof

Each command of the document is a script of `package.json`; each key name is in `SAVE_KEYS`.
