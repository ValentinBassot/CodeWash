# 082 - The phone layout is checked in a real browser and finished

- **Date:** 2026-11-15
- **Commit(s):** `fix(layout): keep the left buttons, the title and the lives inside a phone screen`
- **Debt item:** D56

## What

The app was opened in Chromium at 1280x800, 768x1024 and 390x844 (Playwright, screenshots read one by one). Three defects were found at 390 px and fixed:

- The settings and cosmetics buttons, on the left, still had the desktop size and covered the title: they now follow the same responsive classes as the right ones.
- The row of 10 lives was wider than the screen: the hearts shrink under the `sm` and `md` widths.
- The card hid the title: the content now starts under the buttons on small screens, with more space under the title.

## Proof

- Before and after screenshots at the three widths; no console error at any width.
- 528 tests pass. They do not compute the layout, so the proof of this change is the screenshots.
