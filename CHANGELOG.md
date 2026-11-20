# Changelog

All notable changes to Sokobanko are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A `vX.Y.Z` tag
publishes the image `vindotski/sokobanko` as `X.Y.Z` and `X.Y` (`.github/workflows/ci.yml`).

## [Unreleased]

### Added
- **A map-style camera on the play page.** Pinch to zoom and drag with two fingers to look
  around; on a computer, Ctrl/⌘ and scroll (or a trackpad pinch) zooms around the pointer, scroll
  pans, and + and − zoom. Buttons on the board's corner zoom in and out, show the whole level and,
  once you've looked away, bring the camera back to the player; so does your next move. One
  finger still moves the player, and holding Space still shows the whole level.
- **Controls help:** every gesture and shortcut in one sheet, from Settings or the ? key.

### Changed
- **Sokobanko's code is now licensed AGPL-3.0-only** (was MIT), so anyone who runs a modified
  version as a public site must offer its source. Versions released before this change stay
  available under MIT. The levels keep their own terms.
- **The play page is a focused game screen:** no site header, one top bar (back to Levels, the
  level's name and its place in the collection, Settings) and one bottom bar (the run, then
  labelled Undo, Redo and Restart). The hints and the stuck-box warning sit in the bottom bar
  instead of over the board.
- **Tap the level's name to pick another level:** a list with a tab per collection, opening on
  the level you're playing, takes the place of the Prev/Next buttons. The solved dialog keeps
  its Next level button.
- **Sound and the theme are in the play page's Settings menu.** The Overview toggle gives way to
  the camera buttons.
- **Each collection unlocks on its own:** its first unsolved level is up next, whatever the other
  collections, so you can start Microban before finishing Basics. Within a collection the rule is
  the same as before, and the server enforces it (`levelStates` in `@sokoban/core` takes the
  levels with their collections).
- **The Levels page shows each collection as one row** you can scroll, swipe or step through
  with its arrows, instead of a grid of every level. Each row opens at your next level. The
  rows are shadcn-vue's Carousel (`embla-carousel-vue`), with its buttons at our sizes.
- **The controls are plain shadcn-vue and Tailwind again**, without `@kodentuzo/spotstrap`. The
  colors, square corners, flat edges and fonts are our own tokens in `main.css`, with the same
  values as spotstrap's Sokobanko theme, so the pages look the same. Buttons, toggles and menu rows
  stay 44px tall, and compact ones keep a 44px hit area; `cn` knows the `control` sizes. The
  solved dialog still becomes a sheet at the bottom on phones.
- pnpm's one-day wait for new packages no longer has a spotstrap exception.
- **A best ranks by moves, then pushes:** a run with as many moves and fewer pushes is the new
  best. A tie still keeps the older run.
- **Players' results outlive level changes:** a level that someone has solved can't be deleted
  (the foreign key is `RESTRICT`, no longer `CASCADE`), so a migration can't erase results.
- `bin/import-collection.ts` writes schema-qualified table names, so a collection's migration
  doesn't depend on the role's search path.

### Fixed
- A stray quote in the dialog's and the drawer's close button markup.
- **The database guards its own data** (migration `0002_integrity`): collection order is
  unique, so two collections can't interleave their levels; every level has an order, unique in
  its collection; orders are positive, maps are arrays, results have at least one move and no
  more pushes than moves. `levels.updated_at`, never updated or read, is gone.

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

[Unreleased]: https://github.com/vindotski/sokobanko/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/vindotski/sokobanko/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/vindotski/sokobanko/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/vindotski/sokobanko/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vindotski/sokobanko/releases/tag/v0.1.0
