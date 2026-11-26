# 110 - The game opens on a loading screen with a real percentage and starts lighter

- **Date:** 2026-11-26
- **Commit(s):** `feat(performance): open on a loading screen with a real percentage and load the game in pieces`
- **Debt item:** D38 (not fixed, see Limits)

## What

- `index.html` now holds a small loading screen in plain HTML and CSS, inside `#root`. It is painted before any JavaScript runs, so the window is never blank.
- `src/main.jsx` no longer imports the game. It mounts `LoadingGate`, which calls `loadGame` (`src/utils/preload.js`) and shows `LoadingScreen` with the percentage.
- The percentage is real: 40 % for the game code (`App.jsx` chunk), 5 % for the game data chunk, 55 % shared by the critical images (background and logo of the saved theme, the six skill icons). A missing image counts as done, so the game always opens.
- When everything is loaded the game is shown and the loading screen fades out in 300 ms. If the code cannot be loaded, the screen says so and offers a reload.
- `LoadingScreen` takes a `label` so the translation can pass the word for "Loading".
- Google Fonts is no longer an `@import` inside the CSS (it blocked the first paint until the font server answered, and forever offline). It is a non-blocking link in `index.html`.
- The entry chunk is now React and the loader only (196 kB). The game is a second chunk, loaded while the percentage grows.

## Why

The window stayed blank until one 372 kB script was downloaded, parsed and had built the whole game, and the CSS waited for a remote font. Nothing told the player that the game was starting.

## Method

- Build: `npm run build`, served by `vite preview`. The "before" build is the commit before this change, the "after" build is this change, both served at the same time and measured one after the other, round after round (`docs/performance/measure.mjs`).
- Browser: Chromium 1255 headless (Playwright), 1280x800, a new empty profile for each run, software rendering. Medians of 6 runs (4 with the CPU slowed 4 times), in ms.
- "First paint" is the first contentful paint. "Game ready" is the time at which the menu button exists in the page. "Fonts +800 ms" delays the Google Fonts answer by 800 ms.
- The machine ran other jobs during the runs (load average 7 to 10): read the ratios, not the absolute values.

## Results

| Metric | Before | After |
|---|---|---|
| JS needed for the first React render | 372.39 kB (107.13 kB gzip) | 196.27 kB (62.44 kB gzip) |
| JS in total | 372.39 kB | 377.55 kB (entry 196.27, game 158.86, data 21.79, shim 0.63) |
| First paint (the loading screen, not the game) | 1156 ms | 176 ms |
| First paint, fonts +800 ms | 1900 ms | 200 ms |
| First paint, CPU slowed 4 times | 2788 ms | 448 ms |
| Game ready | 490 ms | 502 ms |
| Game ready, fonts +800 ms | 1243 ms | 554 ms |
| Game ready, CPU slowed 4 times | 1647 ms | 1635 ms |
| Long tasks while starting | 554 ms | 385 ms |
| Requests at start | 22 | 25 |
| Data transferred at start | 2.8 MB | 2.8 MB |

The game itself is ready as fast as before (the images of the first screen are loaded before it shows, so nothing pops in), but the player sees a window after 176 ms instead of 1156 ms, with a progress bar.

## Limits

- Nothing was measured in Electron or on a real machine, only in headless Chromium on localhost: with a slow disk or a network the gain on the first paint is larger, the one on "game ready" is unknown.
- The images are not compressed (no image tool in this environment): the first screen still moves 2.8 MB, of which `reading_icon.gif` is 917 kB.
- The 201 MB of WAV (D38) are not converted: no audio encoder is available here. They are not loaded at start: the music is read when it first plays, the sounds when they are played. D38 stays open.
- The mobs of the cards are not part of the critical images: they depend on the save and appear when the cards show.

## Proof

- New tests: `preload` (progress never goes down and ends at 100, missing image, failing code, saved theme, list of critical images), `LoadingScreen` (percentage, progress bar, fade, error), `LoadingGate` (progress followed, game shown, screen removed after the fade, failure, unmount). 648 tests pass.
- Chromium with every file delayed by 400 ms: the percentage goes 0, 5, 45, 51, 58, 65, 93, 100, then the game shows and the loading screen is removed from the page.
