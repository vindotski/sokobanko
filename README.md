# Sokobanko

The classic box-pushing puzzle, in the browser. Play it at **https://sokobanko.app**. You push boxes onto goals, one at a time, and every move is counted and can be undone. Levels are Markdown files with typed front matter, kept in this repository, and your best results are checked and saved by the server.

**Hosted on [Spotcraft](https://spotcraft.dev).** Sokobanko runs as an app on Spotcraft, on our own servers, with its own Postgres database. The levels are synced into it from `content/levels` when the server starts. A visitor becomes a guest, through Spotcraft's kit, the first time they solve a level, and their best result per level is kept in the database. [DEPLOY.md](DEPLOY.md) has the setup, the [roadmap](docs/roadmap.md) what's next, and [docs/parity.md](docs/parity.md) compares the game with the original Sokoban and the top mobile apps.

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
| `apps/web` | The Nuxt 4 app: pages, layouts, shadcn-vue components, and its server: guests (Spotcraft's kit), the database (Drizzle and its migrations), the levels and the route that checks a solution |
| `packages/core` | The game rules as pure TypeScript: XSB level parsing, moves, LURD replay, unlock order. Unit-tested. |
| `packages/game` | The PixiJS v8 board: rendering, camera, keyboard and joystick input, celebrations |
| `content/levels` | One Markdown file per level (`title`, `map`, `order`), built into the server and synced into the database at boot |
| `docs/` | The roadmap and the parity comparison |

## Getting started

You need Node 26, pnpm 12 (`corepack enable`) and Docker, for Spotcraft's local Postgres.

```sh
pnpm install
cd apps/web
npx spotcraft dev start --name sokobanko       # local Postgres, and the app's database
npx spotcraft dev env --write --name sokobanko # DATABASE_URL and AUTH_SECRET in .env
echo PUBLIC_URL=http://localhost:3000 >> .env
cd ../.. && pnpm dev                           # http://localhost:3000
```

The server applies the migrations and syncs the levels when it starts. `npx spotcraft dev reset --name sokobanko` empties the database again, and `npx spotcraft dev stop` stops Postgres; its data stays.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Runs the web app |
| `pnpm build` | Builds every package |
| `pnpm test` | Unit tests (Vitest). With `DATABASE_URL` set (e.g. `set -a; . apps/web/.env; set +a`), the database tests run too. |
| `pnpm typecheck` | Type-checks every package |
| `pnpm lint` / `pnpm format` | Biome: check, or fix and format |
| `pnpm --filter @sokoban/web db:generate` | Writes a new migration after a change to `apps/web/server/db/schema.ts` |

A new level is a Markdown file in `content/levels`; the tests check that every one parses and, for the official ones, that a known solution solves it. The Docker image is built with `docker build -t sokobanko .`; CI publishes it, and deploying it is described in [DEPLOY.md](DEPLOY.md).

## Stack

Nuxt 4 and Vue 3 · PixiJS v8 · Tailwind CSS v4 with shadcn-vue · TypeScript (strict) · Vitest · Biome · pnpm. Postgres with Drizzle · Spotcraft for hosting and guest sessions.

## Author

[Ivan Vinski](https://www.vin.ski) · [ivan@vin.ski](mailto:ivan@vin.ski)

## License

[MIT](LICENSE). The Hello World! level is from [DoctorLai/sokoban-web](https://github.com/DoctorLai/sokoban-web), also MIT licensed.
