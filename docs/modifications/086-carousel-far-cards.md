# 086 - Far cards slide instead of popping in

- **Date:** 2026-11-16
- **Commit(s):** `fix(carousel): keep hidden cards beyond the shown ones so that a far click slides`
- **Debt item:** D56 (found by clicking the real app)

## What

- The carousel renders 6 cards on each side instead of 3. The cards beyond the third are invisible, cannot be clicked and are hidden from screen readers (`aria-hidden`, `inert`).
- The look of a card by distance (height, tilt, opacity) is computed from its distance, for any distance.

## Why

Clicking a card at the far left or far right moves the carousel by two cards at once. The two cards that had to enter did not exist yet: they appeared at their final place while the others were still sliding, and the leaving ones vanished. Two cards overlapped for half a second (seen with the transition slowed down).

## Behaviour kept

Selecting a card is still immediate, so the battle of a side card still starts as before.

## Proof

- Screenshots in Chromium with the transition slowed to 4 s, clicking the far right and the far left card: the cards slide in and out, no overlap.
- The carousel test is updated (13 cards, 3 shown on each side). 543 tests pass.
