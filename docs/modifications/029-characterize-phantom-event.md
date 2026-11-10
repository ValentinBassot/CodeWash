# 029 - Characterization tests of the phantom fly-by

- **Date:** 2026-11-10
- **Commit(s):** `test: characterize the phantom fly-by event`
- **Debt item:** D01 (prepares D17)

## What

`src/App.phantom.test.jsx`: 5 tests with simulated time and seeded randomness:
- a new player sees a phantom within 5 minutes, its spawn time is saved, it crosses the screen in 8 seconds;
- catching it counts one phantom and shows "+1 Level!", without a level outside battles;
- catching it during a battle gives one level to that skill and a "Phantom Bonus!" notification;
- a second click on the same phantom counts nothing more;
- the next phantom waits at least 5 minutes after the last one, even across a restart (the spawn time is read from `phantomEvent_lastSpawn_v1`).

Coverage floors raised to 90 % of lines.

## Why

The phantom mixes randomness, the clock and storage in one component, and no test covered it. It is the main user of the clock (D17), so it is pinned before the clock becomes injectable. It also writes a key of the save format that was not listed so far: `phantomEvent_lastSpawn_v1`.

## Proof

- `npm run test:coverage`: 227 tests pass, `PhantomEvent.jsx` at 98.3 % of lines, global coverage 91 %.
- Mutation check by hand: no cooldown, a longer flight, no double-click guard, no level during a battle each make a test fail.
