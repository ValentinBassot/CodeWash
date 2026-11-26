# 111 - The home screen does less work while it waits

- **Date:** 2026-11-26
- **Commit(s):** `perf(ui): build the drawers when the browser is idle, pause hidden animations and draw fewer cards`
- **Debt item:** D38 (not fixed, see 110)

## What

- The three drawers (achievements, settings, themes) build their content when the browser is idle (`useDeferredMount`), or at once if the player opens them first. They keep it afterwards, so the slide-out still shows it.
- The achievements drawer is `memo`: the game state changes every second in a fight, its content only changes with the skills and the stats.
- The `backdrop-blur` of the three drawers is removed: they are 95 % opaque, the blur could not be seen and cost a blur of the whole screen when sliding.
- `src/index.css`: the animations inside a closed drawer and inside a card that is not shown are paused. The 13 border previews of the themes drawer animated a `box-shadow` and a `filter` all the time, hidden or not. The cards that are not shown are also `visibility: hidden`, which a transition keeps visible until the move ends.
- The carousel builds 9 cards instead of 13 (`CARDS_EACH_SIDE` 6 to 4). Two cards on each side are shown and a move is at most 2 cards, so the cards that slide in already exist.
- `SafeImage` loads images with `loading="lazy"` and `decoding="async"`.

## Why

At start the page built 2811 elements and 205 images, most of them in drawers nobody had opened, and 13 border previews animated off screen. The drawers are now built when the browser is idle, so this work is moved a few seconds later, not removed. Even when the player did nothing, the main thread was busy about 230 ms each second.

## Results

Same method and caveats as 110. Headless Chromium, 6 runs (3 for the idle line), medians.

| Metric | Before | After |
|---|---|---|
| Elements in the page when the game is ready | 2811 | 756 |
| Images in the page when the game is ready | 205 | 10 |
| Elements in the page 3.5 s later, after the drawers are built | 2814 | 2725 |
| Images in the page 3.5 s later, after the drawers are built | 205 | 201 |
| Main thread busy while nothing happens | 230 ms/s | 161 ms/s |
| Style calculation while nothing happens | 59 ms/s | 23 ms/s |
| Carousel, 5 moves in 4 s: frames per second | 20.2 | 23.5 |
| Carousel, 5 moves in 4 s: slowest 5 % of frames | 100 ms | 83 ms |
| Carousel, main thread busy | 316 ms/s | 263 ms/s |
| Carousel, CPU slowed 4 times: frames per second | 7.6 | 14.6 |
| Carousel, CPU slowed 4 times: slowest 5 % of frames | 367 ms | 233 ms |
| Opening the achievements drawer: style calculation | 49.5 ms | 37.7 ms |
| Opening the achievements drawer: click to next paint | 99 ms | 102 ms |

The review rerun gave 141 ms before and 200 ms after for the same click on a machine under load: treat the drawer click to paint as unchanged, not as an improvement. The click to paint of the drawer did not change: it is dominated by the render of the whole `App` (9 cards) at each state change, which is in `App.jsx` (see Limits). Frames per second are low in absolute value because the headless browser draws with the CPU; only the ratio means something.

## Limits

- Opening a drawer in the first 200 ms builds its content at once, like before.
- A real GPU, Electron and a phone were not measured.
- Keeping the drawer state out of `App` (or `startTransition` around it) would make the drawers open faster: it needs a change of `App.jsx`, left to the owner of that file.

## Proof

- New tests: `useDeferredMount` (idle with and without `requestIdleCallback`, opening before idle, stays after closing, cancelled on unmount), `SafeImage` (lazy, click, placeholder), carousel tests updated to 9 cards. 648 tests pass.
