# 070 - The difficulty picker, the XP bar and the battle panel are components

- **Date:** 2026-11-13
- **Commit(s):** `refactor(skillcard): move the difficulty picker, the xp bar and the battle panel out of SkillCard`
- **Debt item:** D27 (fifth step)

## What

- `src/components/skills/card/DifficultyPicker.jsx`: the minus / image / plus control above the card.
- `src/components/skills/card/XpBar.jsx`: the XP indicator shown during a battle.
- `src/components/skills/card/BattleInfoPanel.jsx`: the "BATTLE" poster beside the card (target, skill, level, quest).
- `SkillCard` renders them. It goes from 568 to 442 lines (1066 at the start).

## Why

These three blocks had no logic in common with the rest of the card but made up a quarter of its markup.

## Proof

- The existing tests pass without any change.
- Unit tests for each component, including the limits of the picker (never below 1, never above the unlocked difficulty).
