# 021 - Stable and faster test runs

- **Date:** 2026-11-09
- **Commit(s):** `test: watch the patterns sequence timer by timer and cap test workers`
- **Debt item:** D01

## What

- The patterns tests follow the sequence timer by timer (`vi.advanceTimersToNextTimer`) instead of polling the screen every 50 ms of simulated time.
- Vitest runs at most 4 test files at once (`maxWorkers: 4`).

## Why

Tests that mount the whole App failed at random with "timed out in 20000 ms" when run with coverage: Vitest started one worker per core (13), each with its own jsdom and App, which saturated the machine (it had already been killed once for lack of memory). The patterns watcher also re-rendered hundreds of times per test. GitHub runners have 4 cores, so 4 workers is also what CI gets.

## Proof

- Patterns tests: 22 s → 9.7 s. The two mutants checked in 019 (sequence that does not grow, clicks accepted during the sequence) still make a test fail.
- `npm run test:coverage`: 198 tests pass twice in a row in about 60 s, where the same suite failed 1 to 5 tests per run before.
