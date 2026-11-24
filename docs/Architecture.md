Sokoban is one Nuxt 4 app at the repository root, plus two TypeScript packages it builds on. The browser plays and keeps progress. The server checks every result by replaying it, and keeps the verified bests in Postgres.

## Layout

| Path | What's in it |
| --- | --- |
| `packages/core` (`@sokoban/core`) | The rules as pure TypeScript, with no DOM and no dependencies: XSB parsing, moves and pushes, dead squares, LURD replay, input-log replay with the undo budget, unlock order, and comparing results. Used by the browser and the server alike, and unit-tested. |
| `packages/game` (`@sokoban/game`) | The PixiJS v8 board: drawing, the map-style camera (follow, zoom, pan, fit), keyboard, joystick, pinch and wheel input, and the celebration. It reports progress (moves, pushes, the input log, undos left) to whoever embeds it. |
| `app/` | The Nuxt pages, layouts and components (shadcn-vue on Tailwind CSS v4), and the browser's data: TanStack DB collections and the upload outbox (`app/collections/`), read through `useProgress()` |
| `server/` | Nitro routes, the database (Drizzle and its migrations, which hold the levels), and who a request comes from |
| `scripts/` | Applying the migrations, importing a level collection, and finding solutions for the tests |
| `docs/` | These docs |

## Pages and navigation

The app is built phone-first:
- **Phones** get a tab bar at the bottom with **Play**, **Progress** and **Help**.
- **Tablets** get the same three as a rail down the left, from `md`.
- **Desktops** get a sidebar, from `lg`.

Settings (theme, sound) is an action, not a section, so it opens as a sheet: from a page's header on phones, from the sidebar elsewhere, and from the pause menu in the game. Every control a finger lands on is at least 44px, and the bars pad for the notch and home indicator (`viewport-fit=cover`).

| Route | Page | Rendered | Indexed |
| --- | --- | --- | --- |
| `/` | **The map**: a Continue card, then each collection as a winding path of level nodes | On the server, from the map hint for a returning player (below); the browser's progress replaces it after load (`ProgressSync` → `useProgressView`) | yes |
| `/levels/:id` | **A level's card**: the board, your best or what unlocks it, and Play. A sheet over the map on phones, a panel beside it on desktops | On the server, with the map behind it | yes |
| `/play/:id` | **The game**: a HUD (goals, moves, undos, best), the board, Undo, Redo and Restart, a pause menu, and Level complete | In the browser | no |
| `/play` | The next level, or the all-solved celebration | In the browser | no |
| `/progress` | Solved count, totals, completed levels | In the browser | no |
| `/help` | How to play, the controls, the FAQ, About | On the server | yes |
| `/privacy`, `/terms`, `/legal` | The privacy notice (with every cookie and storage key), the terms of use, and the legal notice | On the server | yes |

`/levels`, `/profile` and `/faq` redirect (301) to `/`, `/progress` and `/help`.

**The map hint.** Progress lives in the browser, so on its own the server would draw every map empty, and a returning player's map would jump when their progress loaded. So once a level is solved, the browser keeps two small cookies for the server (`app/utils/mapHint.ts`):
- **`sokoban-map`:** each collection's level up next, e.g. `basics:*|microban:microban-041` (`*` once a collection is solved). Collections unlock in order, so this gives every level's state (`seedProgressView`).
- **`sokoban-map-columns`:** how many levels per row the path last fit, so it isn't drawn 4 wide and then re-flowed.

With the hint, the map is hidden for a moment while a script right after the level up next scrolls to it, and only then shown, so it never appears at the top and jumps (a CSS fallback shows it after 2s anyway). The Continue card has the same height in every state. A page drawn from a hint is the player's own, so it's sent with `Cache-Control: private`. Without the cookies (a first visit, or a search engine) the map is drawn without progress, as before. The hint is only a hint: the browser's progress replaces it, and a solved level after the one up next (one added later) shows as locked until then.

**Search engines:**
- Every indexed page has its own title, description, canonical URL and link preview (`usePageSeo`, `public/og.png`). The map also has `VideoGame` structured data.
- `/sitemap.xml` lists the map, Help and every level card, and `/robots.txt` points to it.
- The game and Progress send `X-Robots-Tag: noindex`.
- The site's address is `runtimeConfig.public.siteUrl` (`NUXT_PUBLIC_SITE_URL`).

**Privacy.** No ads or third-party requests; the CSP allows only the site itself. The legal pages are built from Spotstrap's blocks (`@kodentuzo/spotstrap/blocks`, views from its registry in `app/components/`) over the instance's legal facts:
- `GET /api/legal` returns the facts from `/_spotcraft/legal.json` on the app's own address (`legal()` from `@kodentuzo/spotkit/client`, with `PUBLIC_URL`; `LEGAL_URL` overrides the address, and `spotkit dev` sets it to its stand-in). The legal slot serves them to every app. Who runs Sokoban, their address, and what the server does with data live there, never in the repository.
- `/privacy` is `privacyNotice()` with what Sokoban stores itself, plus a section on what this browser keeps (every cookie and storage key) and one on children. `/legal` is `legalNotice()`. `/terms` names the owner from the same facts.
- Visits are counted one way, with no consent and no switch: the instance's script (`analytics()` from `@kodentuzo/spotkit/client`, in `plugins/analytics.client.ts`) sets no cookie and stores nothing on the device.
- **Nothing is stored on the device before the player acts.** Spotkit's storage switch (`storageSwitch`) is off until the first click on a level, or the first move on a level opened from a link (`plugins/storage.client.ts`, `composables/storage.ts`). Only then does the app start the upload outbox, keep a half-played level or the sound setting, or make a guest in the pool (which happens at the first solve). On a later visit the pool's session cookie shows the switch was on (`storageSwitch.restore()`, which creates nothing). The map hint cookies were already set only once a level is solved.

Progress → **Your data** (Spotstrap's `YourData`, `useYourData`):
- **Download your data** saves one JSON file: the guest from the pool, the server's part from `GET /api/me/export` (every result) and this browser's (its `sokoban:*` keys and the cookies).
- **Delete your data** deletes the guest in the pool, which deletes its results with it (a foreign key). Then it clears the browser's keys, cookies and upload outbox, and reloads.

When the app starts storing something new in the browser, or sending data somewhere new, update `pages/privacy.vue` and `LEGAL_UPDATED` (`app/utils/legal.ts`, the terms' date) with it.

## Playing a level

1. **`/play/:id`** renders in the browser only. It takes the level from the levels collection and mounts the board from `@sokoban/game`. A locked level goes to its card instead.
2. **Each move, undo and restart** reports the run: the moves, the pushes, and the **input log**, made of LURD letters, uppercase for pushes, with `z` for each undo. A half-played run is kept in `localStorage`, so a reload resumes it with its undos already used.
3. **On a solve,** the run is recorded in the `runs` collection at once, and the next level in its collection unlocks, whether or not the server can be reached.

## Progress: local first, verified by the server

The browser's data lives in [TanStack DB](https://tanstack.com/db) collections (`app/collections/index.ts`), made once in the browser by `app/plugins/tanstack.client.ts`:

| Collection | Holds | From |
| --- | --- | --- |
| `levels`, `collections` | The levels and collections, in play order | `/api/levels` and `/api/collections`, through TanStack Query |
| `verified` | The server's verified bests | `/api/me/completions`, through TanStack Query |
| `runs` | Each level's best run solved in this browser, with its input log | `localStorage` (`sokoban:runs:v2`), shared by the browser's tabs |

`useProgress()` (`app/composables/progress.ts`) reads them with live queries:
- **`best`:** the better of `verified` and `runs` for each level. Fewer moves wins, then fewer pushes.
- **`states`:** unlocking, through `levelStates` from `@sokoban/core`.
- **Unsynced runs:** which runs the server doesn't have yet.

Levels, Play and Profile render only in the browser, because the collections don't run on the server. Home and the FAQ are still server-rendered.

**Uploading** goes through a durable outbox, [`@tanstack/offline-transactions`](https://tanstack.com/db):

1. A solve that beats the browser's best becomes an offline transaction. The run is written to `runs` optimistically, so the UI updates at once, and the transaction is stored in IndexedDB, so it survives reloads and being offline.
2. The outbox runs transactions one at a time, oldest first, so the server's own unlocking accepts each in turn. Each one posts the run's log. Without a session it answers 401: the browser makes a guest in the user pool and tries again.
3. **Saved:** the run is kept in `runs`, and `verified` is refetched.
4. **Refused** (400, 404, 422: the run doesn't solve the level, or it's over the undo budget): the transaction fails for good. The optimistic run rolls back, and the solved dialog says so.
5. **Offline, a server error, or too many requests:** it retries with backoff, and also when the browser comes back online or the tab becomes visible again. "Locked" (403) is retried a few times, in case an earlier level is still on its way, then given up.

**Only one tab runs the outbox** (leader election with Web Locks or BroadcastChannel):
- A solve in another tab goes straight into `runs`, which `localStorage` shares. The leader sees the change and queues it.
- **Re-queueing:** the leader also re-queues any run that beats the server's best but isn't in the outbox, for example after the guest's session was lost, or for progress kept from before the outbox.

## Verifying a result

`POST /api/levels/:id/complete` takes `{ log }` (`server/api/levels/[id]/complete.post.ts`):

1. **Who is asking:** the visitor's guest, from the user pool's session (below). Without one it answers 401, and the browser makes a guest and tries again.
2. **Unlocked:** the level must be unlocked for that guest. Collections unlock on their own, using the same `levelStates` as the browser.
3. **Replay:** `replayLog` replays the log from the level's start. It refuses unknown letters, blocked moves, an undo with nothing to undo, and more than `UNDO_BUDGET` (3) undos.
4. **Solved:** the final position must solve the level.
5. **Keep the best:** one `INSERT … ON CONFLICT DO UPDATE … WHERE` keeps the run only if it beats the stored best. Two tabs saving at once can't lose the better run.

The server keeps moves, pushes and the time, never the log.

## Guests and the user pool

Players don't sign up. Sokoban uses [Spotcraft](https://spotcraft.dev)'s **user pool**, shared by the apps on a Spotcraft server:

- **Making a guest:** before the first save, the browser makes an anonymous guest through Better Auth's client at `/_spotcraft/auth` on the app's own domain. The pool sets an HttpOnly session cookie.
- **Reading it:** `server/middleware/guest.ts` reads that session with `@kodentuzo/spotkit` (`AUTH_URL`, `AUTH_ISSUER`, `AUTH_JWKS_URL`) and puts the guest's id on the request.
- **If the pool can't answer:** pages still render as for a new visitor, and saves fail. Thanks to local-first progress, the player keeps going anyway.

## Data model

The schema `app_sokoban` (`server/db/schema.ts`):

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
- **`verify`:** lint (Biome), typecheck (vue-tsc for the app and the stories, TypeScript 7 for the packages), then the unit tests, with the database tests run against Spotkit's local stack, then a build.
- **`storybook`:** every story in `stories/` as a test in headless Chromium, in light and dark: it must render, pass its play function and axe, and match its screenshot. Then the static Storybook builds ([Development](Development.md#storybook)).
- **`image`:** a multi-arch (amd64, arm64) distroless image from the `Dockerfile`. On `main` and tags it's pushed to Docker Hub (`vindotski/sokoban`) with an SBOM and provenance.
- **`deploy`** (version tags only): the version's image is copied to the instance's registry, `registry.vin.ski/sokoban`, and Spotcraft deploys it through the app's deploy hook, with zero downtime.

The branching and release flow is in [Contributing](Contributing.md), and the deployment in [Deploying on Spotcraft](Deploying-on-Spotcraft.md).
