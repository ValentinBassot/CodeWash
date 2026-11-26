# 123 - A crash of React shows a clear screen instead of a white page

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** D28 (errors swallowed), and the error boundary part of the Notion task "Sécuriser la lecture du localStorage et ajouter un error boundary"

## What

- `src/components/ErrorBoundary.jsx`: records the crash in the monitoring (`crash` event with the component stack) and shows an alert screen with a button to reload the game. Its texts are in `src/constants/monitoringTexts.js`.
- It is not wired yet: `src/main.jsx` must wrap `<App />` in it (see `docs/MONITORING.md`).

## Why

A render error unmounts the whole React tree: the child sees a white page and the team sees nothing.

## Proof

- Tests: children shown while all is fine, a render error recorded as a crash, the screen and its technical detail, the button (custom and default reload), a thrown value that is not an error.
- A failure of the monitoring while recording the crash no longer prevents the fallback screen. The screen shows the cleaned message, never the raw one.
