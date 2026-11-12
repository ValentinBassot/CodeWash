# 057 - The card carousel lives in its own hook

- **Date:** 2026-11-12
- **Commit(s):** `refactor(navigation): move the card carousel out of App into a hook`
- **Debt item:** D26 (third step)

## What

- `src/hooks/useCarousel.js`:
  - `getVisibleItems(items, selectedIndex)`: the seven cards around the selected one, wrapping at both ends.
  - `useCarousel({ items, locked })` returns `visibleItems`, `isDragging`, `move`, `startDrag`, `drag`, `endDrag` and `selectCard`, and plays the left and right sounds.
- `App` gives it the skills and locks it during a battle. `App.jsx` goes from 1177 to 1125 lines and loses three states.

## Why

The selected card, the swipe and the arrows were three states and five functions of `App` that nothing else used.

## Proof

- The 354 existing tests pass without any change, the navigation tests included.
- 9 unit tests for the hook and its pure function.
