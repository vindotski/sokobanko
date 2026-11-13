# Sokobanko

The classic box-pushing puzzle, in the browser. Play it at **https://sokobanko.app**. You push boxes onto goals, one at a time, and every move is counted and can be undone. It comes with 159 levels: four to start, then David W. Skinner's Microban, all 155. Your best results are checked and saved by the server.

**Hosted on [Spotcraft](https://spotcraft.dev).** Sokobanko runs as an app on Spotcraft, on our own servers, with its own Postgres database. The levels live in that database: its migrations write them, and Postgres is their only source. A visitor becomes a guest, through Spotcraft's kit, the first time they solve a level, and their best result per level is kept in the database. [DEPLOY.md](DEPLOY.md) has the setup, the [roadmap](docs/roadmap.md) what's next, and [docs/parity.md](docs/parity.md) compares the game with the original Sokoban and the top mobile apps.

## What it does

- **Play right away:** no sign-up. Levels unlock in play order, and the Play button picks up where you left off.
- **Keyboard or touch:** arrow keys or WASD, or a joystick that appears wherever you touch the board.
- **Deadlock warnings:** a box pushed where it can never reach a goal, like a corner, is crossed out. The move still counts, and undo takes it back.
- **Undo, redo and restart,** from the toolbar or with Z, Y and R, with moves and pushes counted. A half-played level picks up where you left it. Every solution is kept as LURD (`rRRuL…`) and replayed to check it.
- **Big levels:** the camera follows the player, and an overview (hold Space) shows the whole level.
- **Sound,** off until you turn it on: short synthesized blips for steps, pushes, goals and solves.
- **Light and dark,** following the system. The monochrome board tells pieces apart by shape, and the celebrations respect reduced motion.
- **Your bests,** per level, on the profile page, and under the counter while you play.

Planned features, and what the others have that this doesn't yet, are in [parity.md](docs/parity.md).

## Layout

| Folder | What's in it |
| --- | --- |
| `apps/web` | The Nuxt 4 app: pages, layouts, shadcn-vue components, and its server: guests (Spotcraft's kit), the database (Drizzle, and its migrations, which hold the levels), the levels' routes and the one that checks a solution |
| `packages/core` | The game rules as pure TypeScript: XSB level parsing, moves, LURD replay, unlock order. Unit-tested. |
| `packages/game` | The PixiJS v8 board: rendering, camera, keyboard and joystick input, celebrations |
| `bin/` | `import-collection.ts` turns a collection in plain-text XSB into a migration; `solve-levels.ts` finds the known solutions the tests replay |
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

The server applies the migrations, and with them the levels, when it starts. `npx spotcraft dev reset --name sokobanko` empties the database again, and `npx spotcraft dev stop` stops Postgres; its data stays.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Runs the web app |
| `pnpm build` | Builds every package |
| `pnpm test` | Unit tests (Vitest). With `DATABASE_URL` set (e.g. `set -a; . apps/web/.env; set +a`), the database tests run too. |
| `pnpm typecheck` | Type-checks every package |
| `pnpm lint` / `pnpm format` | Biome: check, or fix and format |
| `pnpm --filter @sokoban/web db:generate` | Writes a new migration after a change to `apps/web/server/db/schema.ts` |

Levels come in collections and are added by a migration: `bin/import-collection.ts` writes one from a plain-text XSB file, after checking every level with the game's parser. Then `bin/solve-levels.ts` adds a solution for each new level to `apps/web/server/utils/solutions.json`, and the database tests check that every level in Postgres replays its solution. The Docker image is built with `docker build -t sokobanko .`; CI publishes it, and deploying it is described in [DEPLOY.md](DEPLOY.md).

## Stack

Nuxt 4 and Vue 3 · PixiJS v8 · Tailwind CSS v4 with shadcn-vue · TypeScript (strict) · Vitest · Biome · pnpm. Postgres with Drizzle · Spotcraft for hosting and guest sessions.

## Author

[Ivan Vinski](https://www.vin.ski) · [ivan@vin.ski](mailto:ivan@vin.ski)

## License

[MIT](LICENSE). The Hello World! level is from [DoctorLai/sokoban-web](https://github.com/DoctorLai/sokoban-web), also MIT licensed. The Microban levels are by David W. Skinner, from [his Sokoban page](https://web.archive.org/web/2010/http://users.bentonrea.com/~sasquatch/sokoban/): his sets "may be freely distributed provided they remain properly credited".
