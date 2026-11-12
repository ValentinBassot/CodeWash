# 052 - Buttons, images, inputs and drawers are usable without seeing them

- **Date:** 2026-11-12
- **Commit(s):** `fix(a11y): name buttons, images and inputs, close drawers with Escape`
- **Debt item:** D54

## What

- The icon buttons have a name: "Open settings", "Open cosmetics", "Open achievements", "Report a bug", "Previous skill", "Next skill".
- `SafeImage` always gives an `alt` to its image, empty when the image is decorative.
- The volume sliders and the answer inputs of the math and writing games have a label.
- The three drawers are dialogs with a name. A closed drawer is hidden from assistive tools and from the keyboard (`aria-hidden`, `inert`).
- Escape closes the open drawer.

## Why

Measured in the running game: 6 buttons announced only as "button", 181 images announced by their file name, inputs without a label, closed drawers still reachable with the Tab key, and no keyboard way to close a drawer.

## Proof

- `src/App.accessibility.test.jsx`: 8 tests written first and seen failing. They list every unnamed button, image without `alt` and unlabelled input on the home screen and in a math and a writing battle, and check Escape on each drawer.
- Whole suite passes.
