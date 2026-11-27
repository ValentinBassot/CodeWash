# 100 - The game keeps the last errors of the page in memory

- **Date:** 2026-11-26
- **Commit(s):** `feat(bug-report): keep the last errors of the page in a circular log`
- **Debt item:** D37 (first step)

## What

- `src/io/errorLog.js` records window errors, unhandled promise rejections and `console.error` calls with date, source, message and stack, in a buffer of 100 entries (message cut at 500 characters, stack at 2,000).
- The date comes from `src/domain/clock.js`. `installErrorLog(target, console)` takes the page and the console, so a test can give fakes. It is installed once by `App` and removed when `App` unmounts; `console.error` is given back only if nobody replaced it meanwhile.
- The log is the ground for the future error monitoring and is part of every bug report.

## Why

A bug report without the errors that came before it is hard to use, and nothing recorded them.

## Proof

`src/io/errorLog.test.js`: 17 tests (circular buffer, cuts, copies, window, promise, console, install once, uninstall). `src/App.bugReport.test.jsx` checks that `App` installs and removes it.
