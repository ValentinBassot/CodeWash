# 081 - The top of the screen fits a phone width

- **Date:** 2026-11-15
- **Commit(s):** `fix(layout): shrink the top buttons, the logo and the title on small screens`
- **Debt item:** D56 (first step)

## What

- The three corner buttons use responsive classes instead of pixel positions: smaller padding and icons under the `md` width, the same size as before from `md` up.
- The logo and the title are smaller under the `sm` width.
- The page can scroll vertically under the `md` width, so the skill buttons stay reachable.

## Not done

- Not checked on a real screen: no browser is installed here. The sizes come from the numbers of the debt entry (390 px). A look at 390 px and at tablet width is still needed.
- The card is still 300 px wide and the carousel 650 px high.

## Proof

- 528 tests pass. They run in jsdom, which does not compute the layout.
