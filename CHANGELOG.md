# Changelog

All notable changes to Sokobanko are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A `vX.Y.Z` tag
publishes the image `vindotski/sokobanko` as `X.Y.Z` and `X.Y` (`.github/workflows/ci.yml`).

## [Unreleased]

## [0.4.0] - 2026-11-20

From a working game to a product: a reason to come back every day, something to aim for on
every level, a link worth sharing, and numbers on how it's played. The loop and its metrics
are in docs/product.md.

Needs no change to deploy: the migrations only add (a column and a table). The analytics
events need Spotcraft 0.7 on the server, which injects Umami; without it they're simply not
sent. Local development uses `spotcraft dev` from `@kodentuzo/spotcraft` 0.7.0.

### Added
- **A daily puzzle** at `/daily`: one level a day for everyone, by UTC date, open whatever
  you've unlocked. Levels come in a shuffled order that doesn't repeat until each has had its
  day; Basics is left out. Results are kept per day, apart from your levels, so a daily solve
  unlocks nothing. Solve it on consecutive days for a streak. The landing page links it next
  to Play.
- **Sharing a daily result:** the share sheet, or a copy where there's none, with the puzzle's
  number, stars, moves and streak, and a link. It never gives the solution away.
- **Par and stars.** Each level's par is the fewest moves known to solve it. Three stars at par
  or under, two up to a quarter over, one for any solve. They show after a solve, on the level
  select with totals per collection, and on the profile.
- `bin/shortest-solutions.ts` searches for each level's fewest moves (A* over moves). It proved
  them for 144 of the 159 levels and shortened 11 more. The stored solutions went from 28,264
  to 20,143 moves, and par follows them.
- **A first-time hint** above the board: push every box onto a goal, and boxes can't be pulled.
  It doesn't block play, and goes after "Got it" or the first solve.
- **Analytics events** for Spotcraft's Umami, with no ids: `level_start`, `level_solve`,
  `level_restart`, `hint_dismissed`, `daily_solve` and `share` (docs/product.md).
- **Icons and link previews:** a favicon, app icons and a web manifest, an Open Graph image,
  and a title and description for every page.
- **A privacy page** that says what the game stores and what Spotcraft counts, with its opt-out.
- A footer with Privacy, FAQ, Feedback and the version; `robots.txt` and a sitemap.
- docs/product.md: the product loop, its events and funnel, and the metrics to watch.

### Changed
- The profile's Best pushes card is now Stars; pushes are still in the table.
- `@kodentuzo/spotcraft` 0.7.0, so `spotcraft dev` runs Umami too.

## [0.3.0] - 2026-11-19

Guests and their progress move into Spotcraft's user pool, shared by every app on the server,
and the tables into the app's own schema. Spotcraft runs the migrations, CI deploys `main`, and
the controls come from spotstrap.

**Breaking:** this version needs Spotcraft 0.6 and moves out of the app's own database once,
through the dashboard's **Move** (DEPLOY.md). Until then its deploys fail and the old version
keeps serving. Local development needs `spotcraft dev` from `@kodentuzo/spotcraft` 0.6.1.

### Changed
- **Guests live in Spotcraft's user pool** (Spotcraft 0.6), shared by every app on the server.
  The browser makes the guest with Better Auth's client before the first save; the server reads
  it with `@kodentuzo/spotkit`. `@spotcraft/kit` is gone. Existing guests move with their
  progress and keep their cookies when the app moves (DEPLOY.md).
- **The tables are in the `app_sokobanko` schema** of Spotcraft's shared database. The
  migrations start again from one that makes today's tables and one that writes the levels.
- **Spotcraft runs the migrations** before a new version starts, through the image's
  `dev.spotcraft.migrate` label (`node .output/server/index.mjs migrate`). The server no longer
  migrates at start, and `/api/health` only checks Postgres.
- **Local development uses `spotcraft dev`** from `@kodentuzo/spotcraft` 0.6.1, one command for
  Postgres, the user pool, `.env` and the migrations. CI runs the database tests on it too.
- DEPLOY.md describes Spotcraft 0.6: releases without downtime, the deploy hook, backups and
  the move into the user pool.
- The colors, square corners and flat edges now come from `@kodentuzo/spotstrap` 0.1.3 and its
  Sokobanko theme, following the light/dark switch as before. The pages look the same; the board
  keeps its own colors. Our type scale stays, and `cn` also knows spotstrap's text sizes.
- pnpm installs a newly published package only once it is a day old, except spotstrap.
- Buttons, toggles, the theme menu, the FAQ and the solved dialog use spotstrap's components, so
  every control is easy to hit on a phone. Buttons are 44px tall; the header and the play
  screen's bars use 36px ones that still take a 44px tap. Their text is 17px, or 15px on the
  small ones (was 14px). Theme menu rows and FAQ questions are 44px.
- On a phone, the solved dialog opens as a sheet at the bottom of the screen, its buttons full
  width.

### Added
- A Content Security Policy on every page, in production. Spotcraft 0.5's Caddy adds the other
  security headers. The game loads `pixi.js/unsafe-eval`, so the policy needs no
  `'unsafe-eval'`.
- CI deploys `main` to Spotcraft through the app's deploy hook and waits until it is live. It
  stays off until the `production` environment has the variable `SPOTCRAFT_HOOK_URL` and the
  secret `SPOTCRAFT_DEPLOY_TOKEN` (DEPLOY.md).

### Fixed
- The destructive button and badge drew white text on a white fill in dark mode. Neither is used
  on a page yet.

## [0.2.1] - 2026-11-13

### Changed
- A box on a goal shows a white check, so it no longer looks like a wall, pairing with the cross
  on a stuck box.
- A goal under the player shows as an outline inside the player, so no goal is hidden. The gallery
  previews used to leave it out.

## [0.2.0] - 2026-11-13

Microban's 155 levels, and a friendlier play screen: redo, keyboard shortcuts, resuming, deadlock
warnings, screen-reader announcements and sound.

### Added
- Microban by David W. Skinner, all 155 levels, after the four Basics, credited in the gallery.
- Collections: the gallery has a section per collection, with its author and solved count, and
  the play page names the level's collection.
- Redo, with a Redo button, and keys for undo (Z or U), redo (Y) and restart (R). Every toolbar
  button names its key.
- A half-played level picks up where you left it, kept in the browser until you restart or solve
  it.
- Your best result for a solved level shows under the move counter while you play.
- Screen readers hear pushes, undos, restarts, solves and resumed runs through a live region, and
  the board is labelled with its keys.
- Deadlock warnings: a box pushed where it can never reach a goal, like a corner, is crossed out,
  with a notice to undo. The move is never blocked.
- Sound: short synthesized tones for steps, pushes, goals, stuck boxes, undo and solves, off
  until you turn it on, and remembered in the browser.

### Changed
- Postgres is now the levels' only source: migrations write them, and the boot sync from
  `content/levels/*.md` is gone. The four levels keep their ids, so saved results stay.

## [0.1.0] - 2026-11-08

The first release, live at https://sokobanko.app on [Spotcraft](https://spotcraft.dev) 0.2.0.

### Added
- The game: four levels (First Push, Big Room, Two Boxes, Hello World!), unlocking in play
  order, with keyboard and touch controls, undo and restart, moves and pushes counted, a camera
  for big levels, and light and dark themes.
- Server-verified results: every solution is replayed on the server, and each player's best
  result per level (fewest moves) is kept.
- Guests through `@spotcraft/kit`: a visitor becomes a guest on their first solved level, with
  an HttpOnly session cookie that lasts a year. No sign-up.
- Postgres, the app's own database on Spotcraft: levels are synced from `content/levels/*.md`
  and migrations applied when the server starts.
- A distroless Docker image (amd64 and arm64), published to Docker Hub by CI, and the runbook
  in `DEPLOY.md`.
- The MIT license.

[Unreleased]: https://github.com/vindotski/sokobanko/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/vindotski/sokobanko/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/vindotski/sokobanko/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/vindotski/sokobanko/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/vindotski/sokobanko/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vindotski/sokobanko/releases/tag/v0.1.0
