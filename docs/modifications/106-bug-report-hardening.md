# 106 - The bug report is safer: cleaned log, characters, private report, capture timeout

- **Date:** 2026-11-26
- **Commit(s):** `fix(bug-report): clean the public issue, cut on characters and harden the drawer`
- **Debt item:** D37

## What

- Every cut (log message and stack, stored stack, description in a link) is made on characters, and the text of a link is made well-formed: an emoji at the border no longer makes `encodeURIComponent` fail. If a link still cannot be built or opened, the drawer says so and keeps the ticket.
- The e-mail holds the contact of the reporter (one line, e-mail only, never in the issue). The texts and `docs/BUG_REPORTING.md` say so exactly.
- The error log is cleaned before it goes in the public issue or the e-mail: quoted text removed, text after the first `...` cut, absolute paths reduced to the file name, lines limited to 200 characters. Best effort, said in the docs.
- The full report and the game file are marked private in the drawer, in the issue text and in the report itself (`privacy` field).
- `VITE_BUG_REPORT_REPO` refuses the segments `.` and `..`.
- The error log never throws and never stops the original `console.error` (circular object without prototype, broken clock).
- Reading, writing and removing the token do not crash when the storage fails, and the drawer says when the token could not be saved. A pasted token loses every space and line break.
- The screen capture stops after 10 seconds without an image and tells to choose an image file.
- After a capture, the drawer reopens only if the player did not open another drawer meanwhile.

## Why

Review findings: a broken emoji made the e-mail button silent, personal data could reach a public issue (paths, a piece of the save quoted by a JSON error), the contact was announced in the e-mail but never put there, and a few failure paths were unprotected.

## Proof

New tests in `ticket`, `text`, `errorLog`, `screenshot`, `config`, `profileStorage`, `BugReportDrawer` and `App.bugReport` (the JSON error `Unexpected token 'z', ..."name":"Alice","hp":zzz}"` and the stack line `file:///C:/Users/Alice/AppData/app.js:1:1` are checked). `npm run test:coverage`, `npm run lint` and `npm run format:check` pass.
