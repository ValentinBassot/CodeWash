# 083 - The battle card fits the screen

- **Date:** 2026-11-15
- **Commit(s):** `fix(battle): fit the zoom of the battle card to the window`
- **Debt item:** D56 (found by opening the battle in the real app)

## What

- `useBattleScale` computes the zoom of the battle card from the window: at most 1.5, less when the height or the width is too small. It leaves room under the card for the lives.
- The card of a battle uses that zoom. The side panel with the target is shown only from 1100 px of width.

## Why

The zoom was always 1.5, so the card was 900 px high and 450 px wide. At 1280x800 its bottom was cut and the lives were hidden behind it. At 390 px it was wider than the screen.

## Proof

- Screenshots in Chromium at 1280x800 and 390x844 before and after: the whole card and the 10 lives are visible.
- 5 unit tests for the zoom and the hook.
