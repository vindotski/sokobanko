# Sokobanko

The classic box-pushing puzzle, in the browser. You push boxes onto goals, one at a time, and every move is counted and can be undone. Levels are Markdown files with typed front matter, published in [Spotcraft](https://github.com/vindotski/spotcraft), and your best results are checked and saved by the server.

**A demo on Spotcraft.** Everything it stores is on Spotcraft's hosted API (https://api.vin.ski), in the `sokobanko` project. The levels are Markdown in this repository, imported into it, and the game's server reads them from there. Every visitor is signed in as a Spotcraft guest. Each player's best results are saved by the server as `progress/<id>.md` in the same project. There's no database of its own. Hosting it on the Hetzner VPS that runs api.vin.ski is the proof of concept, next on the [roadmap](docs/roadmap.md), and [docs/parity.md](docs/parity.md) compares the game with the original Sokoban and the top mobile apps. [SPOTCRAFT_SUGGESTIONS.md](SPOTCRAFT_SUGGESTIONS.md) lists what Spotcraft could support better.

## What it does

- **Play right away:** no sign-up. Levels unlock in play order, and the Play button picks up where you left off.
- **Keyboard or touch:** arrow keys or WASD, or a joystick that appears wherever you touch the board.
- **Undo and restart,** with moves and pushes counted. Every solution is kept as LURD (`rRRuL…`) and replayed to check it.
- **Big levels:** the camera follows the player, and an overview (hold Space) shows the whole level.
- **Light and dark,** following the system. The monochrome board tells pieces apart by shape, and the celebrations respect reduced motion.
- **Your bests,** per level, on the profile page.

Planned features, and what the others have that this doesn't yet, are in [parity.md](docs/parity.md).

## Layout

| Folder | What's in it |
| --- | --- |
| `apps/web` | The Nuxt 4 app: pages, layouts, shadcn-vue components, the levels route (from Spotcraft), and the route that checks a solution |
| `packages/core` | The game rules as pure TypeScript: XSB level parsing, moves, LURD replay, unlock order. Unit-tested. |
| `packages/game` | The PixiJS v8 board: rendering, camera, keyboard and joystick input, celebrations |
| `content/levels` | One Markdown file per level, typed by `_schema.yaml`, imported into Spotcraft |
| `content/progress` | The schema of players' result files, and a copy of the files from Spotcraft, made with `pnpm progress:export`. Spotcraft's copy is the real one. |
| `bin/` | `levels:import` and `levels:export`, which touch only the levels and the progress schema, and `progress:export` |
| `docs/` | The roadmap and the parity comparison |

## Getting started

You need Node 26, pnpm 12 (`corepack enable`), and, for the `levels:*` scripts, Spotcraft's main branch as a worktree next to this repository: `git -C ../spotcraft worktree add ../spotcraft-main main && pnpm -C ../spotcraft-main install`.

```sh
pnpm install
cp apps/web/.env.example apps/web/.env      # then set NUXT_SPOTCRAFT_KEY (Sokobanko's key)
pnpm dev                                    # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Runs the web app |
| `pnpm build` | Builds every package |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Type-checks every package |
| `pnpm lint` / `pnpm format` | Biome: check, or fix and format |
| `pnpm levels:check` | Checks `content/levels` against its schema, with Spotcraft's CLI |
| `pnpm levels:import` | Publishes `content/levels` and the progress schema to the `sokobanko` project, never touching players' files (needs `SPOTCRAFT_KEY`) |
| `pnpm levels:export` | Writes the project's levels back into `content/levels`, after an edit in the dashboard |
| `pnpm progress:export` | Writes the players' results (`progress/<id>.md`) from the project into `content/progress`, removing ones no longer there. Read-only on Spotcraft. |

Deploying (Vercel, at https://sokobanko.vin.ski) is described in [DEPLOY.md](DEPLOY.md). The project is private, so the app needs Sokobanko's key, `NUXT_SPOTCRAFT_KEY` in `apps/web/.env`, to read levels and save results; results go to api.vin.ski, unless `NUXT_SPOTCRAFT_URL` points at a local Spotcraft. The levels come from https://api.vin.ski by default. Set `NUXT_SPOTCRAFT_URL` to read them from another Spotcraft API, such as one running locally. The server caches them for a minute.

## Stack

Nuxt 4 and Vue 3 · PixiJS v8 · Tailwind CSS v4 with shadcn-vue · TypeScript (strict) · Vitest · Biome · pnpm. Spotcraft for levels, guest accounts and results.

## Author

[Ivan Vinski](https://www.vin.ski) · [ivan@vin.ski](mailto:ivan@vin.ski)
