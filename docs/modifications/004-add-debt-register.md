# 004 - Technical debt register

- **Date:** 2026-11-06
- **Commit(s):** `docs: add technical debt register`
- **Debt item:** all (D01 to D42)

## What

Added `docs/DEBT.md`: codebase map (dependency graph, state, I/O), baseline metrics with their commands, 42 debt items, risk matrix and phased attack plan.

## Why

The subject requires a debt register in the repository for the Mid-term Defense, and every refactoring must point to one of its items. Before it, the debt was only in a Notion space.

## Proof

Metrics measured on 2026-11-06 with the commands listed in the file (ESLint, jscpd 4.0.5, madge 8.0.0, npm audit, grep, du). Locations spot-checked against the code (`App.jsx` speech and `JSON.parse` lines, `gameUtils.js:254`, `gameData.jsx:224`, `ParentalVerificationModal.jsx:8`, `soundManager.js` empty catches). Items marked Identified come from reading the code and are not yet pinned by a test.
