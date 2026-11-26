# 102 - Tickets and the optional GitHub token are stored through profileStorage

- **Date:** 2026-11-26
- **Commit(s):** `feat(bug-report): keep tickets and the optional token in local storage`
- **Debt item:** D37

## What

- New keys in `SAVE_KEYS`: `bugTickets_v1` (the last 20 tickets: number, state, link of the issue, ticket) and `bugReportGithubToken_v1`.
- `readTickets`, `addTicket`, `updateTicket`, `readGithubToken`, `writeGithubToken`, `clearGithubToken` and `readSaveFiles` (the three saves, read as objects or kept as text when unreadable).
- A full storage does not crash: the ticket is just not kept, and the game says so.
- The token stays in the local storage of the device. It is not in a `VITE_` variable, in a ticket, or in the bundle.

## Why

The project rule: everything stored goes through this module, with a versioned key.

## Proof

`src/persistence/profileStorage.test.js`: 15 new tests.
