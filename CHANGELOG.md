# Changelog

All notable changes to Sokobanko are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A `vX.Y.Z` tag
publishes the image `vindotski/sokobanko` as `X.Y.Z` and `X.Y` (`.github/workflows/ci.yml`).

## [Unreleased]

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
- **Local development uses `spotcraft dev`** from `@kodentuzo/spotcraft` 0.6, one command for
  Postgres, the user pool, `.env` and the migrations. CI runs the database tests on it too.

### Added
- A Content Security Policy on every page, in production. Spotcraft 0.5's Caddy adds the other
  security headers. The game loads `pixi.js/unsafe-eval`, so the policy needs no
  `'unsafe-eval'`.
- CI deploys `main` to Spotcraft through the app's deploy hook and waits until it is live. It
  stays off until the `production` environment has the variable `SPOTCRAFT_HOOK_URL` and the
  secret `SPOTCRAFT_DEPLOY_TOKEN` (DEPLOY.md).

### Changed
- `@spotcraft/kit` 0.4.0 runs the server's glue: the guest middleware, the start-up check and
  the health check. A phone on IPv6 now counts as one address (its /64) for the guest limit.
- Migrations run through the kit's runner and are recorded in `app_migrations`. On its first
  start, the server takes over the history of Drizzle's migrator without rerunning anything.
  New migrations still come from `pnpm db:generate`.
- The server no longer goes live before its migrations have run: if they fail, it exits, and
  Spotcraft keeps the previous version serving.
- DEPLOY.md describes Spotcraft 0.5: releases without downtime, the deploy hook and backups.
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

[Unreleased]: https://github.com/vindotski/sokobanko/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/vindotski/sokobanko/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/vindotski/sokobanko/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vindotski/sokobanko/releases/tag/v0.1.0
