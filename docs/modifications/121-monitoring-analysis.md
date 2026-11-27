# 121 - The events are summed up and a ticket can be suggested

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none

## What

- `src/monitoring/analysis.js`: pure functions. `summarize(events)` gives the errors by type, the crashes and the crash rate, p50, p95 and max of each operation, the average and minimum FPS, and the key moments. `shouldSuggestTicket(summary)` is true after 1 crash, 3 errors of the same type, an operation with p95 of 5000 ms or more (at least 3 measures) or under 15 FPS over 10 seconds. `ticketSuggestionReasons` says why.
- `src/monitoring/report.js`: `exportReportJson` (schema `codewash-monitoring/1`, summary and events) and `downloadReport` for the file `codewash-health-YYYY-MM-DD.json`.

## Why

A list of raw events cannot be read. The summary shows what is wrong, and the thresholds tell when the app should offer a bug report.

## Proof

- Tests of the percentiles, the weighted FPS, the crash rate, each threshold and a custom threshold, the report and the download with a fake URL API.
