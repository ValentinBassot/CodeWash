# 091 - The notifications stay inside the window, above the game

- **Date:** 2026-11-16
- **Commit(s):** `fix(notifications): stack the toasts at the top of the window, above the game`
- **Debt item:** none (reported by the user)

## What

- `NotificationStack` holds the notices (corrupted save, level reached, achievement) in one column at the top of the window, above everything (`z-[90]`). Its width is the window minus a margin, and on small screens it starts under the corner buttons.
- The level toast moved out of `App` into `LevelToast`. The toasts no longer position themselves.
- The toast animations only move up and down: they no longer depend on the width of the toast.
- Under the `md` width the toasts use smaller texts and paddings, and wrap their content.

## Why

The toasts were fixed at the bottom with an animation that moved them by half of their width. In the Electron app one went off the left side of the screen, and both sat under the battle card and the lives, one over the other.

## Proof

- Chromium at 1366x768, 390x844 and 768x700, with a level reached and an achievement at once: both notices are inside the window, one under the other, above the battle card.
- 4 new tests (stack and level toast), 573 tests pass.
