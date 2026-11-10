# 0001 - Randomness goes through one replaceable source

- **Date:** 2026-11-09
- **Status:** Accepted
- **Debt item:** D16

## Context

The game drew random numbers in 34 places with `Math.random()`: mobs, auras, word lists, math problems, the Phantom event, memory decks, the Simon sequence, music. Tests could only control them by stubbing the global `Math.random`, which also changes every other draw of the App, and coverage varied by about one point between two runs because the mounted App did not always take the same paths.

Options considered:
1. Pass a random generator as a parameter or through a React context to every function and component that draws.
2. One module, `src/domain/random.js`, whose source can be replaced: `Math.random` in the game, a seeded generator in tests.

## Decision

Option 2. Every draw calls `random()` from `src/domain/random.js`. `setRandomSource(fn)` and `resetRandomSource()` replace and restore the source; `createSeededRandom(seed)` builds a reproducible generator (mulberry32). An ESLint rule (`no-restricted-properties`) forbids `Math.random` in `src/` outside this module and the tests.

Option 1 would change the signature of about twenty functions and components spread over `App` and `SkillCard`, the two files that phase 3 is going to split anyway. Option 2 gives the same control to the tests with a one-line change per call site and no change of behavior.

## Consequences

- The game behaves exactly as before: the default source calls `Math.random` at the moment of the draw.
- Tests can make a whole game deterministic with one call, without stubbing a global. Since 028, every test that mounts the App does, and coverage is identical from one run to the next.
- The source is a module-level variable: a test that sets it must reset it (done in the shared test setup).
- When phase 3 splits `App` and `SkillCard`, pure functions can take the generator as a parameter where it makes their tests simpler; this module stays the default.
