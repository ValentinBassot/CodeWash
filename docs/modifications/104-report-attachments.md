# 104 - A report can hold a screenshot, the game file and the full JSON report

- **Date:** 2026-11-26
- **Commit(s):** `feat(bug-report): screenshot, game file and full report downloads`
- **Debt item:** D37

## What

- `src/io/screenshot.js`: screen capture with `getDisplayMedia` (one frame on a canvas, then the capture is stopped), or an image chosen from the files (image only, 5 MB at most). Replaceable provider for tests.
- `src/io/download.js`: saves a JSON file. Replaceable for tests.
- The game file is the save of the three profiles, downloaded by the player and never sent. The full report holds the ticket, the whole error log, the Markdown, the screenshot and the game file.

## Why

GitHub cannot receive a file through a link: what cannot travel is downloaded, and added by hand.

## Proof

`src/io/screenshot.test.js` (12 tests), `src/io/download.test.js` (2).
