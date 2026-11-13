# 071 - The look of a card is computed by pure functions

- **Date:** 2026-11-13
- **Commit(s):** `refactor(skillcard): compute the card tier, border, button and mob picture in a pure module`
- **Debt item:** D27 (sixth step)

## What

- `src/components/skills/card/cardStyle.js`: `getLevelStyle` (text colour and border of a level tier), `getBorderEffect` (the border chosen by the player), `getButtonStyle` (colours taken from the card background), `resolveMob` (picture and name of the mob, zombie when unknown).
- The eight-step `if` ladder of the tiers becomes a table.
- `SkillCard` goes from 442 to about 330 lines (1066 at the start).

## Behaviour kept

Same classes, same colours, same fallbacks as before.

## Proof

- The existing tests pass without any change.
- `cardStyle.test.js` covers every tier boundary, every border kind and every mob fallback.
