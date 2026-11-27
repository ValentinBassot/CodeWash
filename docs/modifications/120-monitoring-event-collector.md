# 120 - A local collector records the events of the app

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none (team request: follow bugs, crashes and latency)

## What

- `src/monitoring/events.js`: the typed events `error`, `crash`, `latency`, `fps` and `flow`. `buildEvent` cuts the texts, refuses an unknown type or flow name, and keeps only the allowed keys of a flow detail (no profile name).
- `src/monitoring/collector.js`: `createCollector({ capacity = 500, clock })`, a circular buffer that drops and counts the oldest events. The clock is `now()` of `src/domain/clock.js` by default and can be replaced.
- `src/monitoring/monitor.js`: the collector of the app, with `recordFlow`, `recordCrash` and `measure(name, operation)` (sync or promise, success or failure).
- `docs/MONITORING.md`: what is followed, how to read it, what is not done.

## Why

The team wants to follow the whole flow of the app to find more bugs. Everything stays on the device: children play the game, nothing may be sent out.

## Proof

- Tests of the schema, the buffer (503 events keep 500, 3 dropped), the clock, the listeners, `measure` and the app monitor.
- The monitoring cannot break the game: `record` never throws, a throwing listener is ignored, texts that cannot be turned into a string fall back, and the helpers `recordFlow` and `recordCrash` survive an error that cannot be read.
- Error messages are cleaned before they are stored: quoted text and anything after `...` is removed, so a `JSON.parse` message cannot carry a piece of a save. The values of a flow detail must be numbers, booleans, short identifiers, or one of a fixed list of words.
