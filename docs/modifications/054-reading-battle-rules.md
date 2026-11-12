# 054 - A reading battle follows the same death and boss rules as math

- **Date:** 2026-11-12
- **Commit(s):** `fix(reading): apply the death and boss rules in a reading battle`
- **Debt item:** D58 (found while preparing the extraction of speech recognition)

## What

`handleSuccessHit` reads the skill in battle from a ref, like the skills, the stats and the hearts since 049.

## Why

Speech recognition is started in the same click that starts the battle, so it kept a copy of the hit handler in which no battle was running yet. In a reading battle, dying therefore cost no level, and a wrong word against a boss cost a heart instead of healing the boss. Stopping and restarting the microphone gave it a fresh copy, so the rules changed in the middle of a game.

## Proof

- 2 App tests written first and seen failing: at level 5, ten wrong words cost a level; against the level-20 boss, wrong words heal it and never kill the player.
- Whole suite passes.
