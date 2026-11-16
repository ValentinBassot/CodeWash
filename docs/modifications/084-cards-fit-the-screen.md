# 084 - The cards fit the screen height with a safe margin

- **Date:** 2026-11-15
- **Commit(s):** `fix(layout): zoom the logo, the title and the cards to fit the window with a bottom margin`
- **Debt item:** D56

## What

- `useFitToViewport` measures the block made of the logo, the title and the carousel, and gives a zoom between 0.4 and 1 so that the block ends at least 96 px above the bottom of the window (72 px for the lives and a margin). Under the `md` width, 64 px more are kept for the corner buttons.
- `App` applies that zoom to the block.
- On small screens the bug button moves above the lives, so that it does not cover them.

## Why

The cards are 300x600 px and the block is about 1060 px high. On every window lower than 900 px the button of the central card and the lives were below the screen (card button at 933 px and lives at 993 px, for any height from 568 to 864).

## Proof

- Measured in Chromium at 10 sizes, from 1920x1080 to 320x568: the button of the central card is always at least 56 px above the lives, and the lives are inside the window.
- Screenshots read at 1366x768, 360x640 and 320x568. The battle, drawers and corrupted save flows replayed without a console error.
- 7 unit tests for the zoom and the hook, 543 tests in total.

## Limit

`zoom` is read by Chromium (Electron, Chrome, Edge), Firefox 126 and Safari. The measure of the height was checked on Chromium only.
