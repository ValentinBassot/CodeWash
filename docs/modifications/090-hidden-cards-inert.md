# 090 - The cards that are not visible cannot be clicked

- **Date:** 2026-11-16
- **Commit(s):** `fix(carousel): make the invisible cards inert`
- **Debt item:** none (reported by the user)

## What

- Only the two cards on each side of the central one can be reached. The cards farther away are invisible, so they are now inert (`inert`, `aria-hidden`, no pointer events) like the extra cards added in 086.

## Why

The cards three places from the centre had no opacity, but their buttons could still be clicked, tabbed to and read by a screen reader.

## Proof

- New test: the 8 cards out of reach are inert, hidden and without pointer events. The navigation tests now expect 5 reachable skills.
- The tests that press the button of a skill first turn the carousel until that button is reachable (`showCard` in `src/test/game.jsx`). 569 tests pass.
