# Sokobanko

The classic box-pushing puzzle, in the browser. You push boxes onto goals, one at a time, and every move is counted and can be undone. Levels are Markdown files with typed front matter, and your progress is kept on your device.

**Sokobanko is being rebuilt.** It's moving off Supabase to a single Nuxt app, with its levels served from [Spotcraft](https://github.com/vindotski/spotcraft)'s hosted API, and progress kept in the browser. Until Phase 4 of the roadmap, the code below still runs on a local Supabase stack. [docs/roadmap.md](docs/roadmap.md) gives the order of the work, [docs/parity.md](docs/parity.md) compares the game with the original Sokoban and the top mobile apps, and [docs/decisions/](docs/decisions/) records why (from Phase 0).

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
| `apps/web` | The Nuxt 4 app: pages, layouts, shadcn-vue components, and the route that checks a solution |
| `packages/core` | The game rules as pure TypeScript: XSB level parsing, moves, LURD replay, unlock order. Unit-tested. |
| `packages/game` | The PixiJS v8 board: rendering, camera, keyboard and joystick input, celebrations |
| `supabase/` | Today's database (migrations, seed levels, pgTAP tests); removed in Phase 4 |
| `docs/` | The roadmap, the parity comparison and, from Phase 0, the decision records |

Phase 1 flattens this into one Nuxt package (`app/lib/sokoban`, `app/lib/game`), and Phase 2 moves the levels to `content/levels/*.md`.

## Getting started

You need Node 26, pnpm 12 (`corepack enable`) and, until Phase 4, Docker.

```sh
pnpm install
pnpm supabase start                         # local Postgres and Auth, with the seed levels
cp apps/web/.env.example apps/web/.env      # the local stack's fixed development keys
pnpm dev                                    # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Runs the web app |
| `pnpm build` | Builds every package |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Type-checks every package |
| `pnpm lint` / `pnpm format` | Biome: check, or fix and format |
| `pnpm supabase db reset` | Recreates the local database from migrations and seed levels (and wipes progress) |
| `pnpm supabase test db` | The database tests (pgTAP) |

From Phase 0, Spotcraft's main branch is also needed next to this repository, as a worktree at `../spotcraft-main` (see the roadmap's Phase 0).

## Stack

Nuxt 4 and Vue 3 · PixiJS v8 · Tailwind CSS v4 with shadcn-vue · TypeScript (strict) · Vitest · Biome · pnpm. Progress moves to Dexie (IndexedDB) and levels to Spotcraft, as the roadmap describes.

## Author

[Ivan Vinski](https://www.vin.ski) · [ivan@vin.ski](mailto:ivan@vin.ski)
