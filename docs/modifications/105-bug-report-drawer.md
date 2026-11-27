# 105 - The bug button opens a bug report drawer

- **Date:** 2026-11-26
- **Commit(s):** `feat(bug-report): replace the placeholder modal with a bug report drawer`
- **Debt item:** D37 (done)

## What

- `BugReportDrawer` replaces `BugReportModal` (deleted): contact of the game, form with validation, attachments, create issue, send by e-mail, full report, ticket list (title, date, state, link, send again, paste the issue link) and the optional token. Clear messages for success, failure and offline.
- Accessible: dialog with a name, labels, `aria-invalid` and described errors, alerts and status messages, focus in the title when it opens, closed with Escape, its button or the overlay, inert when closed. It closes during a screen capture so it is not in the picture.
- All its texts are in `src/constants/bugReportTexts.js`, ready for translation (D36).
- `docs/BUG_REPORTING.md` explains the feature, the configuration and how to test the reception.
- The form is built only when the drawer is opened for the first time and the drawer is memoized: rendering it from the start made `App.reading.test.jsx` three times slower (12 s to 32 s for one test), because the testing library scans the whole page on each query.
- The D37 test of `App.navigation.test.jsx` is replaced by `src/App.bugReport.test.jsx`.

## Why

The button only said "Whoa... That sucks..." with nothing to fill in.

## Proof

`BugReportDrawer.test.jsx` (43 tests), `App.bugReport.test.jsx` (6).

`npm run test:coverage`: 805 tests pass (71 files), global coverage 95.5 % of lines. The files added by this feature are at 100 % of lines.
