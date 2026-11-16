# 092 - The border previews fit their card on a small screen

- **Date:** 2026-11-16
- **Commit(s):** `fix(cosmetics): scale the border effect previews to their card`
- **Debt item:** none (reported by the user)

## What

The square that previews a border effect was 96 px wide whatever the width of its card. It now takes the width of its card, up to 96 px, and stays square.

## Why

Under a phone width the drawer is about 330 px wide, so each of the three columns is about 90 px wide: the previews were wider than their card, overlapped their neighbours and went out of the card with their glow.

## Proof

- Chromium at 390x844, 320x640 and 768x1024 with the drawer open: no preview goes outside its card (measured), and the screenshot at 390 px shows each preview inside its card.
- No new test: the tests do not compute the layout. 573 tests pass.
