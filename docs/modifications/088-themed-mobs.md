# 088 - The mobs follow the theme

- **Date:** 2026-11-16
- **Commit(s):** `feat(themes): show the mobs of the theme on the cards, Pokemon first`
- **Debt item:** none (reported by the user)

## What

- A theme can have a roster of mobs: `src/constants/themeRosters.js` lists, for each kind (hostile, miniboss, boss), a name and a picture.
- The card shows the mob of the roster at the same place as the mob of the game, so the saves do not change and switching theme changes the pictures at once. If the roster has fewer mobs than the game, it starts again from the first.
- The Pokemon theme has its roster: 20 Pokemon for the hostile mobs, 4 for the minibosses and 4 for the bosses. The pictures are the official artworks of the PokeAPI sprites repository, in `public/assets/mobs/pokemon/` (3.9 MB).
- Without a roster (Minecraft, K-Pop Demon Hunters, Spy) or for a kind the roster does not have (the chests of cleaning), the original mob is shown.

## How to give mobs to another theme

Put the pictures in `public/assets/mobs/<theme>/`, add the theme to `THEME_ROSTERS` with the names and the picture paths, and add `roster: THEME_ROSTERS.<theme>` to the `assets` of the theme in `THEME_CONFIG`. A test checks that every picture of a roster is on disk.

## Not done

- K-Pop Demon Hunters and Spy keep the Minecraft mobs. The official pictures of the film are on the Fandom wiki, whose image server refuses direct downloads from a script, and no free pack fits the Spy theme. The pictures have to be saved by hand into the folders above.
- The sounds of the mobs, the names of the skills and the chests of cleaning still come from Minecraft.
- The Pokemon pictures belong to Nintendo, Game Freak and The Pokemon Company: they are used here for a school project.

## Proof

- Chromium with the Pokemon theme: Growlithe, Eevee, Snorlax and Abra on the cards.
- 9 new tests (roster files on disk, mob choice). 560 tests pass.
