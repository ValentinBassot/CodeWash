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
| 044 | 2026-11-11 | [Switching profile keeps each profile's stats and border](044-profile-switch-keeps-each-profile.md) |
| 045 | 2026-11-11 | [Saved levels and difficulties are brought back in range](045-validate-saved-level-and-difficulty.md) |
| 046 | 2026-11-11 | [An invalid saved current profile opens profile 1](046-invalid-current-profile.md) |
| 047 | 2026-11-11 | [Every read and write of the save goes through the persistence module](047-storage-behind-persistence.md) |
| 048 | 2026-11-12 | [The result of a hit is computed outside App](048-hit-resolution-out-of-app.md) |
| 049 | 2026-11-12 | [A victory and a death count once in development](049-pure-state-updates.md) |
| 050 | 2026-11-12 | [A profile never played shows the level of a new game](050-level-of-unplayed-profile.md) |
| 051 | 2026-11-12 | [The browser tab shows the name of the game](051-tab-title.md) |
| 052 | 2026-11-12 | [Buttons, images, inputs and drawers are usable without seeing them](052-accessible-names.md) |
| 053 | 2026-11-12 | [A refused microphone no longer restarts in a loop](053-refused-microphone.md) |
| 054 | 2026-11-12 | [A reading battle follows the same death and boss rules as math](054-reading-battle-rules.md) |
| 055 | 2026-11-12 | [Speech recognition lives in its own hook](055-voice-listener-hook.md) |
| 056 | 2026-11-12 | [A word heard with a space around it still counts](056-trim-heard-word.md) |
| 057 | 2026-11-12 | [The card carousel lives in its own hook](057-carousel-hook.md) |
| 058 | 2026-11-12 | [Loading and summarizing a profile leave App](058-profile-loading-out-of-app.md) |
| 059 | 2026-11-12 | [The profiles and their save live in a hook](059-profiles-hook.md) |
| 060 | 2026-11-12 | [Challenges, auras and difficulty changes are computed outside App](060-challenge-aura-difficulty-out-of-app.md) |
| 061 | 2026-11-12 | [One way to record a stat and announce an achievement](061-achievement-toast-hook.md) |
| 062 | 2026-11-12 | [The difficulty of a battle's questions is computed outside App](062-challenge-difficulty-out-of-app.md) |
| 063 | 2026-11-12 | [A difficulty unlocks after its boss is beaten](063-difficulty-unlocks-after-the-boss.md) |
| 064 | 2026-11-12 | [The memory game is its own component](064-memory-game-component.md) |
| 065 | 2026-11-13 | [A memory game won without a mismatch counts as perfect](065-perfect-memory-game.md) |
| 066 | 2026-11-13 | [Fixes found by an independent review of the unmerged work](066-review-findings.md) |
| 067 | 2026-11-13 | [The patterns game is its own component](067-patterns-game-component.md) |
| 068 | 2026-11-13 | [The typed answer of the math and writing games is one component](068-typed-answer-component.md) |
| 069 | 2026-11-13 | [The challenge box and the microphone button are components](069-challenge-prompt-and-mic-button.md) |
| 070 | 2026-11-13 | [The difficulty picker, the XP bar and the battle panel are components](070-skillcard-panels.md) |
| 071 | 2026-11-13 | [The look of a card is computed by pure functions](071-skillcard-style-helpers.md) |
| 072 | 2026-11-13 | [The hit flash of a mob lives in a hook](072-hit-flash-hook.md) |
| 073 | 2026-11-15 | [What a wrong answer does is decided outside App](073-mistake-rules.md) |
| 074 | 2026-11-15 | [The phantom bonus level is added by the domain](074-phantom-level.md) |
| 075 | 2026-11-15 | [The battle session lives in a hook](075-battle-session-hook.md) |
| 076 | 2026-11-15 | [The Complete! button of the cleaning skill is a component](076-cleaning-challenge.md) |
| 077 | 2026-11-15 | [The inside of a battle card is a component](077-battle-body.md) |
| 087 | 2026-11-16 | [A word said inside a sentence counts, and what is heard is shown](087-voice-phrase-match.md) |
