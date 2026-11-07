# 013 - Characterization tests of the math battles

- **Date:** 2026-11-07
- **Commit(s):** `test: characterize math battles through the interface`
- **Debt item:** D01 (prepares D26, D27)

## What

`src/App.battle.test.jsx`: 10 tests that play real battles through the interface: press the card button, read the question on screen, type the answer. Simulated time skips the animations. They freeze:
- a right answer: 12 damage, 20 XP; five right answers: mob defeated, level up, new full-health mob, stats updated; two victories count two battles;
- a wrong answer: no damage to the mob; ten wrong answers: death counted, level 1 cannot drop; at level 5, death costs a level that the next victory gives back (its XP, computed at level 4, stays below the next level);
- a miniboss (level 10) falls in one hit; a wrong answer heals a boss (level 20) to full instead of hurting the player; beating the boss raises the difficulty, awards the first badge and spawns 180 HP mobs.

The test setup now reinstalls the audio stubs before each test (they were removed by `vi.restoreAllMocks`).

## Why

Battles are the heart of the game and live in the two hot spots, `App` (D26) and `SkillCard` (D27). They must be pinned through the interface, the way a player uses them, before those files are split.

## Proof

- `npm run test:coverage`: 136 tests pass, 3 runs in a row. Global coverage 65.4 to 66 % of lines (was 52.6 %), `App.jsx` 62 %.
- Mounting the whole App with coverage instrumentation takes more than Vitest's default 5 s: the timeout is raised to 20 s (`testTimeout`), otherwise battle tests failed at random.
- Global coverage varies by about 1 point between runs, because the mounted App draws random numbers (D16). Floors are set 1 to 2 points below the measure (64 % of lines) so the gate does not flicker.
- Mutation check by hand on the battle handler: 6 changes (boss healing, minimum level, difficulty increase, XP per hit, miniboss one-hit, battle counter). The first run let one survive (battle counter); a test with two victories was added and now all 6 make a test fail.
