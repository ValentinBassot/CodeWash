# 122 - Sensors watch the errors, the long tasks and the frames

- **Date:** 2026-11-26
- **Commit(s):** `see git log`
- **Debt item:** none

## What

- `src/monitoring/sensors.js`: `installErrorSensor` (window `error` and `unhandledrejection`), `installLongTaskSensor` (`PerformanceObserver` `longtask`, nothing when unsupported) and `createFpsSampler` (`requestAnimationFrame`, one measure per second, recorded every 10 seconds and at stop).
- `src/monitoring/install.js`: `installMonitoring()` installs everything once, records `app-start`, starts the frame sampler on `battle-start` and stops it on `battle-end`; `uninstallMonitoring()` removes everything.
- The window, the observer class and the frame functions are options, so they are replaceable.

## Why

The frame measure costs a callback at each frame: it must run only during a battle. Installing and uninstalling keeps tests and the app clean.

## Proof

- Tests with a fake window, a fake `PerformanceObserver` and fake frame functions: errors, rejections, long tasks, frames (average 30, minimum 20), hidden tab window dropped, double install, uninstall.
- The handlers of the sensors catch their own failures. A sensor that cannot be installed is skipped, the error sensor removes what it added if the second listener is refused, and uninstalling removes every sensor even if one removal throws.
- The frame sampler does not start without a function to cancel the frames. At most one long task per second is recorded, so that a game that lags does not push the crashes out of the buffer.
