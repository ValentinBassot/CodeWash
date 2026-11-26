# Performance

How the game starts, how to measure it, the budgets to keep, and how to add an asset without slowing the start.

## How the game starts

1. `index.html` paints a loading screen written in plain HTML and CSS (no JavaScript needed).
2. `src/main.jsx` loads the entry chunk (React and the loader only) and mounts `LoadingGate`.
3. `loadGame` (`src/utils/preload.js`) loads the game code, the game data and the critical images in parallel and reports a real percentage: 40 % code, 5 % data, 55 % critical images.
4. When it reaches 100 %, the game is shown and the loading screen fades out.

The critical images are the background and the logo of the saved theme and the six skill icons (`criticalAssets`). Everything else is loaded when it is first needed.

## How to measure

Everything below runs from the repository root. Chromium is needed (the one installed by Playwright is fine).

1. Build and serve the production build:

    ```sh
    npm run build
    npx vite preview --port 4302
    ```

2. Bundle size: the table printed by `npm run build`. The first React render needs the `index-*.js` chunk and the CSS only.
3. Browser metrics: `docs/performance/measure.mjs` opens the page in a fresh Chromium profile for each run and prints, as median and minimum:
    - first paint (`fcpMs`), game ready (`interactiveMs`), long tasks, requests and bytes at start;
    - the time spent opening the achievements drawer (`menuToPaintMs`, `menuScriptMs`, `menuStyleMs`);
    - frames per second, the slowest 5 % of frames and the main thread load while the carousel moves (`fps`, `frameP95`, `cpuMsPerSec`).

    ```sh
    npm install --no-save playwright-core
    CHROME=/path/to/chrome node docs/performance/measure.mjs <runs> <cpuSlowdown> <fontDelayMs> <label>=<url> [<label>=<url> ...]
    ```

    - Give two builds (`before=http://localhost:4301/ after=http://localhost:4302/`) to compare them: the runs are interleaved, which cancels most of the noise of the machine.
    - `cpuSlowdown` 4 simulates a slow computer. `fontDelayMs` 800 simulates a slow answer of Google Fonts.
    - Close other heavy programs: the numbers are only comparable between runs of the same session. A headless browser draws with the CPU, so frames per second are low in absolute value.

4. In a normal browser: Chrome DevTools, Performance tab, record a reload (First Contentful Paint, long tasks) or a few carousel moves (frames), and the Network tab with "Disable cache" for the requests.

## Budgets

Measured on 2026-11-26 (see `docs/modifications/110-loading-screen-with-percentage.md` and `111-lighter-home-screen.md`). A change that goes over a budget needs a reason in its note.

| What | Now | Budget |
|---|---|---|
| Entry chunk (`index-*.js`), first React render | 196 kB (62 kB gzip) | 220 kB (70 kB gzip) |
| Game chunk (`App-*.js`) | 159 kB (41 kB gzip) | 200 kB (55 kB gzip) |
| CSS | 64.6 kB | 70 kB |
| Critical images (loaded before the game shows) | about 1.7 MB | 2 MB |
| First paint, local, headless Chromium | 176 ms | 300 ms |
| Game ready, local, headless Chromium | 502 ms | 700 ms |
| Elements in the page when the game is ready, before the drawers are built | 756 | 1000 |
| Elements in the page about 3.5 s later, once the drawers are built | 2725 | 3000 |
| Carousel, headless Chromium | 23 fps | no drop below 20 fps |

## Add an asset without slowing the start

- Put the file under `public/assets/` and refer to it with a relative path (`assets/...`, no leading slash): the Electron app opens the page from disk.
- Show images with `SafeImage`: it loads them lazily and shows a placeholder when the file is missing. A plain `<img>` needs `loading="lazy"` and `decoding="async"`.
- Do not `import` an image or a sound in a module: it would end up in the entry chunk. Keep paths in the data files.
- An image needed on the very first screen goes in `criticalAssets` (`src/utils/preload.js`) so that its load counts in the percentage and it does not pop in. Add a test with it. Keep the critical images under the budget above.
- Keep images light: PNG or WebP under 300 kB, animated GIF under 500 kB. Several existing GIFs are far larger (`items/book.gif` is 12 MB) and should be compressed.
- Sounds are played with `soundManager` and fetched when first played. Do not preload music. Do not add a WAV over 1 MB: use a compressed format (Ogg, MP3). The six music files are 199 MB of WAV (debt D38) and still wait for an audio encoder.
- A new drawer or large panel that stays mounted should use `useDeferredMount` for its content and have the `inert` attribute while closed: the stylesheet pauses the animations inside a closed `[role="dialog"]` and inside a carousel card that is not shown.
- Re-run the measure above before and after, and write the numbers in the note of the change.
