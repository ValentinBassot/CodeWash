# 101 - A bug ticket is a pure, tested object

- **Date:** 2026-11-26
- **Commit(s):** `feat(bug-report): build, validate and write bug tickets`
- **Debt item:** D37

## What

- `src/domain/ticket.js`: field validation (title, description, category, optional e-mail), `buildTicket`, the save summary (profiles with a save, themes, unreadable saves: no name, level or win count), the Markdown of a GitHub issue, links that fit a length limit (new issue page 7,000 characters, e-mail 1,800: oldest errors dropped first, then the description cut, always said in the text), the full report, the save file and the check of an issue link.
- The e-mail of the reporter never goes in the public issue.
- The texts of the issue are in `ISSUE_TEXTS`, in `src/constants/bugReportTexts.js`.

## Why

The bug button only sympathized. The report needs one place where its rules live, testable without a browser.

## Proof

`src/domain/ticket.test.js`: 43 tests.
