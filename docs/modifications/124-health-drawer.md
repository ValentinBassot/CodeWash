# 124 - The "App health" drawer shows the summary

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none

## What

- `src/components/drawers/HealthDrawer.jsx`: a dialog (`aria-label`, `aria-hidden`, `inert` while closed) with the status, the reasons to report a problem, the errors, crashes, latency table, frames, key moments and a button to export the JSON. It closes with its button and with Escape. It follows new events while it is open.
- `src/constants/monitoringTexts.js`: all its texts (and those of the crash screen) in one module, ready for the translation.
- The button "Report a problem" shows only when a ticket is suggested and `onReportProblem` is given.

## Why

The summary is useless if nobody can read it. The player or a parent can look at it and export it for a bug report.

## Proof

- Tests: closed state, empty state, calm summary, latency table, reasons and report button, dropped events, live update, export content, close button and Escape.
