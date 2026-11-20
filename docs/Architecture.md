Sokobanko is one Nuxt 4 app at the repository root, plus two TypeScript packages it builds on. The browser plays and keeps progress. The server checks every result by replaying it, and keeps the verified bests in Postgres.

## Layout

| Path | What's in it |
| --- | --- |
| `packages/core` (`@sokobanko/core`) | The rules as pure TypeScript, with no DOM and no dependencies: XSB parsing, moves and pushes, dead squares, LURD replay, input-log replay with the undo budget, unlock order, and comparing results. Used by the browser and the server alike, and unit-tested. |
| `packages/game` (`@sokobanko/game`) | The PixiJS v8 board: drawing, the map-style camera (follow, zoom, pan, fit), keyboard, joystick, pinch and wheel input, and the celebration. It reports progress (moves, pushes, the input log, undos left) to whoever embeds it. |
| `app/` | The Nuxt pages, layouts and components (shadcn-vue on Tailwind CSS v4), the Pinia progress store, and the client plugin that syncs progress |
| `server/` | Nitro routes, the database (Drizzle and its migrations, which hold the levels), and who a request comes from |
| `scripts/` | Applying the migrations, importing a level collection, and finding solutions for the tests |
| `docs/` | This wiki, published from `main` |

## Playing a level

1. **`/play/:id`** renders the level from `/api/levels` and mounts the board from `@sokobanko/game`, which runs only in the browser.
2. **Each move, undo and restart** reports the run: the moves, the pushes, and the **input log**, made of LURD letters, uppercase for pushes, with `z` for each undo. A half-played run is kept in `localStorage`, so a reload resumes it with its undos already used.
3. **On a solve,** the run is recorded in the progress store (`app/stores/progress.ts`) at once, and the next level in its collection unlocks, whether or not the server can be reached.

## Progress: local first, verified by the server

The store keeps two views and merges them:

- **`local`:** runs solved in this browser, kept with their input logs in `localStorage` (`sokobanko:progress:v1`).
- **`server`:** the verified bests from `/api/me/completions`, also sent with the server-rendered page.
- **`best`:** the better of the two for each level. Fewer moves wins, then fewer pushes. Unlocking (`levelStates` in `@sokobanko/core`) and the pages read this.

**Sync** (`sync()`, started by `app/plugins/progress.client.ts`) uploads the runs the server doesn't have yet, or has a worse result for. It runs:
- once the page is ready
- after each solve
- when the browser comes back online
- when the tab becomes visible again

It uploads them in play order, so the server's own unlocking accepts each one in turn. How it handles failures:
- **Offline, the server down, or rate-limited:** it stops and tries again on the next trigger.
- **The server refuses a run** (it doesn't solve the level, or it's over the undo budget): the run is dropped from the browser too.

## Verifying a result

`POST /api/levels/:id/complete` takes `{ log }` (`server/api/levels/[id]/complete.post.ts`):

1. **Who is asking:** the visitor's guest, from the user pool's session (below). Without one it answers 401, and the browser makes a guest and tries again.
2. **Unlocked:** the level must be unlocked for that guest. Collections unlock on their own, using the same `levelStates` as the browser.
3. **Replay:** `replayLog` replays the log from the level's start. It refuses unknown letters, blocked moves, an undo with nothing to undo, and more than `UNDO_BUDGET` (3) undos.
4. **Solved:** the final position must solve the level.
5. **Keep the best:** one `INSERT … ON CONFLICT DO UPDATE … WHERE` keeps the run only if it beats the stored best. Two tabs saving at once can't lose the better run.

The server keeps moves, pushes and the time, never the log.

## Guests and the user pool

Players don't sign up. Sokobanko uses [Spotcraft](https://spotcraft.dev)'s **user pool**, shared by the apps on a Spotcraft server:

- **Making a guest:** before the first save, the browser makes an anonymous guest through Better Auth's client at `/_spotcraft/auth` on the app's own domain. The pool sets an HttpOnly session cookie.
- **Reading it:** `server/middleware/guest.ts` reads that session with `@kodentuzo/spotkit` (`AUTH_URL`, `AUTH_ISSUER`, `AUTH_JWKS_URL`) and puts the guest's id on the request.
- **If the pool can't answer:** pages still render as for a new visitor, and saves fail. Thanks to local-first progress, the player keeps going anyway.

## Data model

The schema `app_sokobanko` (`server/db/schema.ts`):

| Table | Holds | Guards |
| --- | --- | --- |
| `collections` | id, title, author, credit, order | `order` positive and unique |
| `levels` | id, collection, title, order, map (XSB rows as JSON) | `order` positive and unique in its collection; `map` is an array |
| `progress` | guest, level, moves, pushes, completed at: one row per guest and level | moves > 0; 0 ≤ pushes ≤ moves; the level can't be deleted while it has results (`RESTRICT`); deleting a guest deletes their results |

`progress.user_id` references `auth.users`, the user pool's table in the same database.

**The levels' only source is Postgres.** Migrations write them (`scripts/import-collection.ts` generates one from an XSB file). The app's own migrator (`server/db/migrate.ts`) applies them under an advisory lock. The tests replay a known solution for every level (`server/utils/solutions.json`).

## CI and releases

`.github/workflows/ci.yml`:

- **`branch-name`** (pull requests): branches are `feature/`, `bugfix/` or `chore/`, and target `main`.
- **`verify`:** lint (Biome), typecheck (vue-tsc for the app, TypeScript 7 for the packages), then the tests, with the database tests run against Spotcraft's local stack, then a build.
- **`image`:** a multi-arch (amd64, arm64) distroless image from the `Dockerfile`. On `main` and tags it's pushed to Docker Hub with an SBOM and provenance.
- **`deploy`** (version tags only): the tagged commit's image goes to Spotcraft through its deploy hook, with zero downtime.
- **`wiki`** (`main`): publishes `docs/` to this wiki.

The branching and release flow is in [Contributing](Contributing.md), and the deployment in [Deploying on Spotcraft](Deploying-on-Spotcraft.md).
