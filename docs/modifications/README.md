# Modifications

Every change to the project has its own short note in this folder, written in the same pull request as the change.

- One file per change, numbered in order: `NNN-what-changed.md` (`001`, `002`, ...).
- Take the next free number. If two pull requests use the same number, the one merged second renames its note.
- Start from [TEMPLATE.md](TEMPLATE.md). Keep it short: what, why, proof.
- Link the debt register item the change addresses, and add a line to the table below.

| # | Date | Change |
|---|---|---|
| 001 | 2026-11-05 | [Remove AppleDouble files, add .gitignore](001-remove-appledouble-add-gitignore.md) |
| 002 | 2026-11-05 | [Environment doctor and one-command launch](002-add-doctor-and-launcher.md) |
| 003 | 2026-11-05 | [README and first launch log](003-add-readme-and-launch-log.md) |
| 004 | 2026-11-06 | [Technical debt register](004-add-debt-register.md) |
| 005 | 2026-11-06 | [Upgrade Vitest to 5.1.0](005-upgrade-vitest.md) |
| 006 | 2026-11-06 | [Prettier formatter and format check](006-add-prettier.md) |
| 007 | 2026-11-07 | [Coverage and characterization tests of the game rules](007-characterize-game-rules.md) |
| 008 | 2026-11-07 | [Characterization tests of the achievements](008-characterize-achievements.md) |
| 009 | 2026-11-07 | [CI pipeline and coverage gates](009-add-ci-pipeline.md) |
| 010 | 2026-11-07 | [Characterization tests of the save format](010-characterize-save-format.md) |
| 011 | 2026-11-07 | [Characterization tests of the sound manager](011-characterize-sound-manager.md) |
| 012 | 2026-11-07 | [Characterization tests of the game data](012-characterize-game-data.md) |
| 013 | 2026-11-07 | [Characterization tests of the math battles](013-characterize-math-battles.md) |
| 014 | 2026-11-08 | [.env configuration](014-add-env-configuration.md) |
| 015 | 2026-11-08 | [Characterization tests of the writing battles](015-characterize-writing-battles.md) |
| 016 | 2026-11-08 | [Characterization tests of the reading battles](016-characterize-reading-battles.md) |
| 017 | 2026-11-08 | [Characterization tests of cleaning and the manual success button](017-characterize-cleaning.md) |
| 018 | 2026-11-08 | [Characterization tests of the memory game](018-characterize-memory.md) |
| 019 | 2026-11-08 | [Characterization tests of the patterns game](019-characterize-patterns.md) |
| 020 | 2026-11-08 | [Characterization tests of profiles, themes, parent mode and reset](020-characterize-app-flows.md) |
| 021 | 2026-11-09 | [Stable and faster test runs](021-stabilize-test-runs.md) |
| 022 | 2026-11-09 | [Characterization tests of navigation, drawers and difficulty](022-characterize-navigation.md) |
| 023 | 2026-11-09 | [Remove an unreachable branch in PixelHeart](023-remove-unreachable-heart-color.md) |
| 024 | 2026-11-09 | [Coverage gate on changed lines](024-gate-changed-lines-coverage.md) |
| 025 | 2026-11-09 | [Save keys and legacy fallback in one place](025-centralize-save-keys.md) |
| 026 | 2026-11-09 | [A corrupted profile entry no longer crashes the game](026-fix-corrupted-profile-entries.md) |
| 027 | 2026-11-09 | [Randomness through one replaceable source](027-replaceable-random-source.md) |
| 028 | 2026-11-09 | [Deterministic game tests](028-deterministic-game-tests.md) |
| 029 | 2026-11-10 | [Characterization tests of the phantom fly-by](029-characterize-phantom-event.md) |
| 030 | 2026-11-10 | [Phantom spawn key in the save keys](030-phantom-key-in-save-keys.md) |
| 031 | 2026-11-10 | [Time through one replaceable clock](031-replaceable-clock.md) |
| 032 | 2026-11-10 | [Login days are counted in local time](032-local-login-day.md) |
| 033 | 2026-11-10 | [Every sound through the sound manager](033-one-sound-manager.md) |
| 034 | 2026-11-10 | [One rule to judge a spoken word](034-one-reading-rule.md) |
| 035 | 2026-11-10 | [Speech recognition behind src/io](035-speech-recognition-module.md) |
| 036 | 2026-11-10 | [The microphone restarts when the browser ends the session](036-microphone-restarts.md) |
| 037 | 2026-11-10 | [Subtractions never have a negative answer](037-no-negative-subtraction.md) |
| 038 | 2026-11-10 | [A wrong word costs a heart in the writing game](038-wrong-word-costs-a-heart.md) |
| 039 | 2026-11-11 | [Remove the progressive damage the patterns game never applied](039-remove-ignored-progressive-damage.md) |
| 040 | 2026-11-11 | ["Jack of All Trades" without any skill has no tier](040-jack-of-all-trades-without-skills.md) |
| 041 | 2026-11-11 | [Old saves get a mob matching their difficulty](041-old-save-mob-health.md) |
| 042 | 2026-11-11 | [Skills are built from a save outside App](042-build-skills-outside-app.md) |
| 043 | 2026-11-11 | [The save is parsed once per profile load](043-parse-save-once.md) |
