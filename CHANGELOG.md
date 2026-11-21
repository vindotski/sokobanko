# Changelog

All notable changes to Sokobanko are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). A `vX.Y.Z` tag
publishes the image `vindotski/sokobanko` as `X.Y.Z`, `X.Y` and `latest`, and deploys it
(`.github/workflows/ci.yml`, the wiki's Contributing page).

## [Unreleased]

### Added
- **Privacy policy, terms of use and legal notice** (`/privacy`, `/terms`, `/legal`), linked from
  Help, Settings and the sidebar. The policy lists everything Sokobanko processes, where and for
  how long, and every cookie and storage key; there's no consent banner because nothing is used
  for anything but the game. They're built from Spotstrap's blocks (`@kodentuzo/spotstrap` 0.2.0)
  over the instance's legal facts (`LEGAL_FACTS`, read with `@kodentuzo/spotkit` 0.2.0), so who
  runs it and their address are never in the repository.
- **Your data**, on Progress (Spotstrap's block): download everything about you as a file, or
  delete your guest in the pool, which deletes your results with it, and clear this browser.
  Where the instance counts visits and you have a say, a switch turns it off.

## [0.7.0] - 2026-11-21

### Changed
- **Rebuilt phone-first, after Candy Crush's flow and Apple's Human Interface Guidelines.** Every
  feature is kept:
  - **Navigation:** on phones a tab bar at the bottom (Play, Progress, Help); on tablets a rail,
    and on desktops a sidebar. Settings (theme and sound together) opens as a sheet from any page.
  - **The map is home:** a Continue card for your next level, then each collection as a winding
    path of numbered levels, solved, up next or locked, scrolled to where you are.
  - **Level cards:** tapping a level opens its card, a sheet on phones or a panel beside the map
    on desktops, with the board, your best or what unlocks it, and a big Play. Each card has its
    own address, `/levels/<id>`.
  - **The game:** a HUD (goals, moves, undos, best), Undo, Redo and Restart at 44px, a pause menu
    (resume, restart, levels, theme, sound, controls, the map), and a Level complete screen with a
    big Next. On desktops the counts and controls sit beside the board. A locked level goes to
    its card.
  - **Progress** (was the profile) and **Help** (the FAQ, with how to play, the controls and
    About) are sections of their own. `/levels`, `/profile` and `/faq` redirect.
  - **Safe areas:** the bars pad for the notch and home indicator.
- **Search engines can find the levels:**
  - The map and every level card are server-rendered, with titles, descriptions, canonical
    links and link previews.
  - There's a sitemap, `robots.txt`, `VideoGame` structured data, a favicon and an Apple touch
    icon.
  - The game and Progress aren't indexed.

### Fixed
- **The map no longer jumps when it loads.** The server draws a returning player's map with their
  progress, from a small cookie the browser keeps, already scrolled to the level up next and at
  the width it fits. The Continue card has the same height whatever it shows, and the tab bar no
  longer grows as the page streams in.

## [0.6.0] - 2026-11-20

### Added
- **Storybook** (`pnpm storybook`) documents the components: the shadcn-vue primitives, Sokobanko's
  own (level previews and cards, the level switcher, the play page's menus and camera controls,
  and the PixiJS board), and the design tokens. A Theme toolbar shows light and dark.
- **Every story is a test** (`pnpm test:storybook`, CI's new `storybook` job): rendered in
  headless Chromium in light and dark, it must pass its play function, axe accessibility checks,
  and a screenshot comparison with its baseline. `update-screenshots.yml` renders new baselines.

### Fixed
- The footer's link to the author is named by its visible text, so voice control can follow it.
- The controls help no longer scrolls sideways in its sheet; its cells wrap.

## [0.5.0] - 2026-11-20

### Changed
- **Progress runs on TanStack DB.** Levels, collections and the server's bests are read through
  TanStack Query into TanStack DB collections. Runs solved in the browser are a localStorage
  collection, and live queries work out bests and unlocking. Uploads go through a durable outbox
  in IndexedDB (`@tanstack/offline-transactions`): oldest first, retried with backoff, run by one
  tab at a time, and kept across reloads. Solves in other tabs are queued by the tab that runs it.
  This replaces the Pinia store and its hand-written sync, and Pinia is gone. Progress kept by
  earlier versions is moved over on the first visit.
- **Levels, Play and Profile render in the browser only**, from the collections. Home and the FAQ
  are still server-rendered.
- **Releases deploy from version tags.** Merging to `main` only builds the image; pushing a
  signed `vX.Y.Z` tag deploys it, and `latest` follows releases. `dev` is gone: work happens on
  `feature/`, `bugfix/` and `chore/` branches cut from `main` and merged back into it, which CI
  checks (the wiki's Contributing page).
- **The app lives at the repository root.** `app/`, `server/`, `public/` and `nuxt.config.ts`
  moved up from `apps/web`, and the root `package.json` is the app's; `packages/core` and
  `packages/game` stay workspace packages. Docker, CI and `spotcraft dev` run from the root, and
  `.env` is written there.
- **Packages are `@sokobanko/core` and `@sokobanko/game`** (were `@sokoban/*`), and the scripts
  are in one `scripts/` folder (`import-collection.ts` and `solve-levels.ts` were in `bin/`).
- **The agents' skills are no longer committed:** `skills-lock.json` lists them, and
  `npx skills experimental_install` restores them (the wiki's Development page).
- **The README is an introduction, and the technical docs moved to the
  [wiki](https://github.com/vindotski/sokobanko/wiki):** architecture, getting started,
  development, contributing, deploying on Spotcraft, and self-hosting with Docker. They're
  written in `docs/` and published from `main` by CI's `wiki` job. `DEPLOY.md` became the wiki's
  Deploying on Spotcraft page, `CONTRIBUTING.md` is a short summary, the old roadmap is retired,
  and the README has screenshots.

## [0.4.0] - 2026-11-20

### Added
- **A map-style camera on the play page.** Pinch to zoom and drag with two fingers to look
  around; on a computer, Ctrl/⌘ and scroll (or a trackpad pinch) zooms around the pointer, scroll
  pans, and + and − zoom. Buttons on the board's corner zoom in and out, show the whole level and,
  once you've looked away, bring the camera back to the player; so does your next move. One
  finger still moves the player, and holding Space still shows the whole level.
- **Controls help:** every gesture and shortcut in one sheet, from Settings or the ? key.

### Changed
- **Three undos per attempt.** Undo is no longer unlimited: each attempt at a level has three,
  shown on the Undo button, and Restart gives them all back. Redo is free. Reloading a
  half-played level keeps the undos already used. The game now saves its full input log, undos
  included, and the server replays it, so a result that used more undos is refused. Bests set
  before this change stay.
- **Progress is local first.** A solve counts as soon as it happens and unlocks the next level
  even when the server can't be reached. It's kept in the browser and uploaded once the server is
  back (on the next visit, on reconnecting, or on returning to the tab), in play order. The server
  still replays every solution and keeps the verified best. A run it refuses is dropped from the
  browser too. The profile marks results that haven't synced yet.
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

[Unreleased]: https://github.com/vindotski/sokobanko/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/vindotski/sokobanko/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/vindotski/sokobanko/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/vindotski/sokobanko/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/vindotski/sokobanko/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/vindotski/sokobanko/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/vindotski/sokobanko/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/vindotski/sokobanko/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vindotski/sokobanko/releases/tag/v0.1.0
