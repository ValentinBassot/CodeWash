# 080 - The Jack of All Trades text shows real progress

- **Date:** 2026-11-15
- **Commit(s):** `fix(achievements): show how many skills reached the next Jack of All Trades tier`
- **Debt item:** D48

## What

- The progress text counts the skills that reached the level of the next tier, for example "2/6 skills at level 60+".
- At the top tier it shows the top level. The total is the number of skills, no longer a written 6.

## Why

The old text counted the skills at or above the lowest level, which is always every skill, so it always said 6/6.

## Decision

The intended meaning was not written anywhere. This one follows the achievement description ("Level all skills evenly"): it tells how close the player is to the next tier.

## Proof

- A new test with three cases (none, some, top tier), the existing tests updated.
