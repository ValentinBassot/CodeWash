# 132 - The chests and the farm follow the theme

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** D35 (Minecraft branding hard-coded)

## What

The rosters of the K-Pop Demon Hunters and Pokemon themes (`src/constants/themeRosters.js`) now hold two more kinds: `chest` (six pictures for the six chests of the cleaning skill) and `memory` (the picture of the memory skill). `resolveMob` in `cardStyle.js` uses them, so the cleaning card no longer shows a Minecraft chest, and the memory card no longer shows the Minecraft villager of the farm, in those two themes. The Minecraft theme and a theme without roster still show the original pictures.

## Why

The first themed mobs (notes 088 and 089) left the chests and the farm in Minecraft on purpose, and a card of the K-Pop theme still showed a chest and a villager.

## Limits

- No new picture was added: the chests and the memory skill reuse pictures already on disk (singers for K-Pop, Pokemon for Pokemon). A picture that fits the skill, like an egg for "Match n' Hatch", has to be supplied.
- The Spy theme still has no pictures, so it shows the Minecraft ones everywhere.
- The skill icons and the other pictures of the interface are not themed yet.

## Proof

- `cardStyle.test.js`: the chest and memory pictures come from the roster, and the original ones stay when the roster has none.
- `themeRosters.test.js`: every kind, including `chest` and `memory`, has pictures that exist on disk.
