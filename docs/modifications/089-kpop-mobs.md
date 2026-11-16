# 089 - The K-Pop Demon Hunters theme has its mobs

- **Date:** 2026-11-16
- **Commit(s):** `feat(themes): give the K-Pop Demon Hunters theme its own mobs`
- **Debt item:** none (reported by the user)

## What

- The roster of the K-Pop Demon Hunters theme has 10 chibi pictures: 5 for the hostile mobs, 3 for the minibosses and 2 for the bosses, in `public/assets/mobs/kpop/`. One style only (chibi) was kept.
- The pictures come from the page https://www.cleanpng.com/free/kpop-demon-hunters.html, which says they are free to download and use.

## How the pictures were prepared

The page gives previews of 400 px with a grey and white checkerboard drawn in the picture, not a transparent background. The full PNG is behind a download page that refuses scripts (HTTP 403), which was not worked around. The checkerboard of the previews was removed by filling it from the edges of the picture, then the light pixels on the edge of the character were removed.

## Limits

- The pictures are small (400 px high) and a few have a light edge. Some previews kept pieces of checkerboard inside the picture (between the legs, under the flames), so those pictures were left out.
- For a better result, save the full PNG from each page of cleanpng by hand, with the same file names, in `public/assets/mobs/kpop/`.
- The names of the mobs describe the picture. They are not the names of the characters of the film.
- The Spy theme still has the Minecraft mobs.

## Proof

- Chromium with the K-Pop theme: the cards show the chibi mobs and their names.
- The roster test checks that every picture is on disk. 568 tests pass.
