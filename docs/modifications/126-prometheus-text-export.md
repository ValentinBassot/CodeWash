# 126 - The summary can be written in the Prometheus text format

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none

## What

- `src/monitoring/prometheus.js`: `toPrometheusText(summary)`, a pure function. Metrics in snake_case with the `codewash_` prefix, `counter` and `gauge` types, labels limited to error types, operation names and key moment names.
- `docs/MONITORING.md` has a section "Prometheus and Grafana": the analysis and the recommendation (later, not now).

## Why

Prometheus pulls from a server and the game has no backend. Sending data out also breaks the rule that nothing leaves the device. The function only prepares a future connection.

## Proof

- Tests of the names, the types, the samples, the absence of messages, empty metrics and the escaping of labels.
