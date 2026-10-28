# Sokoban

**The classic box-pushing puzzle, rebuilt for the browser.** Play instantly with no sign-up. Every best score is verified by the server.

`v0.1.0 MVP` · `Nuxt 4` · `Vue 3` · `PixiJS v8` · `Supabase / Postgres` · `TypeScript` · `Tailwind v4` · `shadcn-vue`

---

## At a glance

| | |
| --- | --- |
| **What** | A full-stack web game: landing page, level gallery, game, player profile, FAQ |
| **Who** | [Ivan Vinski](https://www.vin.ski). Solo project covering product, UX, frontend, backend and database. |
| **When** | 25–26 October 2026 · 70 small, reviewed commits |
| **Status** | MVP complete and runs locally; not deployed yet |
| **Shows** | Product thinking and MVP scoping · canvas rendering and game input · secure backend design (RLS, server-side verification) · monorepo architecture · testing and verification |

---

## What it does

- **Instant play.** Open the site and press *Let's play*. Each visitor gets a guest account in the background, so progress is saved from the first solve with no sign-up.
- **Works on any device.**
  - keyboard: arrow keys or WASD
  - phones: a drag joystick inside the game canvas
- **A camera made for big levels.**
  - The zoom depends on the screen size, not the level size.
  - The view follows the player smoothly, with a dead zone.
  - An *Overview* mode shows the whole level. On desktop, hold Space to peek.
- **Results you can trust.** When you solve a level, the server replays your solution move by move before saving it. Faked scores are rejected.
- **Progression.** Levels unlock in order, and the rule is enforced in the UI *and* on the server.
  - The gallery marks the level that's up next and dims the locked ones.
  - Opening a locked level shows how to unlock it.
- **Feedback.**
  - a completion dialog with this run, your verified best and a "New best!" badge
  - sparks on the board when you solve a level, confetti when every level is solved
  - both are skipped when the system asks for reduced motion
- **Light and dark theme.** It follows the system setting, with a Light / Dark / System toggle. The game board uses the same colour tokens as the rest of the UI.
- **Profile.** Levels solved, best moves and pushes, and a table of completed levels.

---

## Why I built it

Sokoban is a small game that still raises real product and engineering questions:

1. **How do you get someone playing in zero clicks?** Guest sessions, and one adaptive play button: *Let's play* → *Continue* → *Random level*.
2. **How do you keep progress for people who never sign up?** Use a real, anonymous database user, not `localStorage`, so it can become a full account later without moving any data.
3. **How do you trust a score that comes from a browser?** Re-run the solution on the server with the same game code.
4. **How do you leave room to grow without overbuilding?** The schema already supports player-made levels and accounts, but the MVP ships only what's needed now.

The full write-up of decisions, alternatives and trade-offs lives in my portfolio case study.

---

## How it works

```
┌──────────────────────── pnpm monorepo ────────────────────────┐
│                                                               │
│  packages/core     Pure TypeScript game rules: level parsing, │
│                    moves, solution replay, progression.       │
│                    No DOM. Unit-tested. Used by browser       │
│                    AND server.                                │
│        ▲                         ▲                            │
│        │                         │                            │
│  packages/game     PixiJS renderer, camera, joystick,         │
│                    keyboard, particles.                       │
│                    createGame(element, level, options)        │
│        ▲                         │                            │
│        │                         │                            │
│  apps/web          Nuxt 4 app: pages, layouts, shadcn-vue UI, │
│                    Pinia store, and one server route:         │
│                    POST /api/levels/:id/complete              │
│                                  │                            │
│  supabase/         Postgres: migrations, Row Level Security,  │
│                    grants, seed data, pgTAP tests             │
└───────────────────────────────────────────────────────────────┘
```

### Engineering highlights

**1. Play on the client, verify on the server.**
- Every move runs instantly in the browser, with no network round trip per keypress.
- On a win, the browser sends the solution as a compact move string (`rRRuL…`).
- The server route loads the level, replays the string with the *same* `@sokoban/core` code, and records the result only if it really solves the level.
- The server never trusts the client's move count or "solved" flag; it recomputes both.
- *Rejected alternative:* a server-authoritative game with one request per move. It would add latency to every step and per-move state to store, with no real security gain.

**2. One rule, enforced in two places.**
- **Progression:** a single pure function, `levelStates()`, decides which levels are solved, current or locked. The UI uses it to show locks, and the server uses it to reject a locked level with `403`.
- **Level validation:** the map rules (at most 50×50, exactly one player, as many goals as boxes) exist in TypeScript *and* as a Postgres check function. Invalid levels can't get into the database, even through a direct insert.

**3. A deliberate security model.**
- Row Level Security is enabled on every table.
- Each table starts with `revoke all`, then grants explicitly.
- Players can read only their own completions.
- Only the server's service role may write completions, through a single database function that keeps the best result.
- Constraints make the stored move and push counts match the stored solution.

**4. Anonymous-first auth.**
- Guests sign in anonymously, only in the browser, so crawlers and server renders don't create users. Sign-in never blocks the first paint.
- The session cookie lasts 400 days, so guests don't lose progress overnight.
- Usernames are reserved for permanent accounts, to prevent name squatting.

**Other details:**
- The game package is framework-free; the Vue wrapper is about 80 lines.
- Board colours come from CSS design tokens and are redrawn live when the theme changes.
- PixiJS is loaded only on the client and only on the play page.

---

## Tech stack

| Area | Choice | Why |
| --- | --- | --- |
| App framework | **Nuxt 4** (Vue 3, SSR) | Pages, layouts and server routes in one app; server-rendered pages are fast and crawlable |
| Game rendering | **PixiJS v8** | A WebGL/WebGPU canvas for a smooth board, camera and particles |
| UI | **shadcn-vue** (Reka UI) + **Tailwind CSS v4** | Accessible components I own as source code, themed with design tokens |
| State | **Pinia** | A small shared store for the player's progress |
| Backend and database | **Supabase**: Postgres, Auth, RLS | Real Postgres with Row Level Security and anonymous auth, run locally through the CLI |
| Language | **TypeScript** (strict) | Shared types from the database to the UI; generated Supabase types |
| Testing | **Vitest**, **pgTAP** | Unit tests for game rules, database tests for policies and constraints |
| Tooling | **pnpm workspaces**, **Biome** | A fast monorepo with one tool for linting and formatting |
| Extras | `@nuxtjs/color-mode`, `canvas-confetti` | Theme handling without a flash of the wrong theme; a tiny confetti effect where PixiJS would be overkill |

---

## Quality

- **60 unit tests** (Vitest):
  - level parsing
  - movement and pushes
  - solution replay
  - camera maths
  - joystick input
  - level progression
- **Database tests** (pgTAP) for Row Level Security policies, grants and constraints.
- **Static checks:** strict TypeScript, `vue-tsc` and Biome across the repo.
- **Checked in a real browser:**
  - Each feature was checked against the production build in headless Chrome: real key presses and clicks, light and dark, desktop and phone widths, reduced motion, and no console errors.
  - The server rules were tested by posting real solutions, generated by a small breadth-first solver.
- **Git history:** small, single-purpose conventional commits (`feat(core): …`, `feat(web): …`), so every change can be reviewed on its own.

---

## How it was built

I built Sokoban pairing with an AI coding agent (Claude Code).
- **My part:** the product and UX decisions, the scope, and the trade-offs. I reviewed and committed every change myself.
- **The agent's part:** for each feature it researched the code, proposed options with trade-offs, implemented the one I chose, and checked it in a browser.
- **The workflow:** features split into small units, one commit each, with frequent course corrections after trying things in use.

---

## Local development

### Prerequisites

- **Node.js 26+**
- **pnpm 12** (`corepack enable` picks up the pinned version)
- **Docker**, for the local Supabase stack

### Setup

```sh
# 1. Install dependencies
pnpm install

# 2. Start the local Supabase stack (Postgres, Auth, Studio) in Docker.
#    Migrations and seed data are applied automatically on first start.
pnpm supabase start

# 3. Configure the web app. The example file already contains the local
#    stack's fixed development keys (they are not secrets).
cp apps/web/.env.example apps/web/.env

# 4. Run the app
pnpm dev
```

Open **http://localhost:3000**. You're signed in as a guest automatically; press *Let's play*.

**Seed data:**
- four levels: First Push, Big Room, Two Boxes, Hello World!
- one permanent user: `admin@example.com` / `0000`, with the username `admin`

### Useful commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the web app in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint and check formatting with Biome |
| `pnpm format` | Apply Biome fixes and formatting |
| `pnpm db:types` | Regenerate the Supabase TypeScript types for the web app |
| `pnpm supabase status` | Print the local stack's URLs and keys |
| `pnpm supabase db reset` | Recreate the database from migrations and seed data. This also wipes guest progress. |
| `pnpm supabase test db` | Run the pgTAP database tests |
| `pnpm supabase stop` | Stop the stack; data is kept (`--no-backup` wipes it) |

### Local services

The ports use the 546xx range, so this stack can run alongside other local Supabase projects.

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| Supabase API | http://127.0.0.1:54621 |
| Postgres | postgresql://postgres:postgres@127.0.0.1:54622/postgres |
| Supabase Studio (database UI) | http://127.0.0.1:54623 |
| Mailpit (test emails) | http://127.0.0.1:54624 |

---

## Repository structure

```
apps/
  web/                      Nuxt 4 app
    app/
      pages/                /, /levels, /play, /play/[id], /profile, /faq
      layouts/              landing, default (reading column), play (full screen)
      components/           SokobanGame, LevelPreview, PlayButton, SiteHeader, ThemeToggle, …
      components/ui/        shadcn-vue components (source owned by the project)
      composables/ stores/  data loading and player progress
    server/api/levels/[id]/complete.post.ts   solution verification
packages/
  core/                     game rules, level parser, replay, progression (+ tests)
  game/                     PixiJS game: renderer, camera, joystick, keyboard, particles
supabase/
  migrations/               profiles, levels, level_completions (RLS, grants, functions)
  tests/database/           pgTAP tests
  seed.sql                  levels and the demo user
```

---

## Roadmap

- **Accounts:** upgrade a guest to a permanent account (email or OAuth) and keep all progress; then usernames.
- **Leaderboards:** fewest moves per level, built on the verified completions that already exist.
- **Player-made levels:** an editor, drafts and publishing. The schema already supports it.
- **More levels and level packs.**
- **Polish:** sound, move animation, and undo history that survives a reload.

---

## Contact

**Ivan Vinski** · [www.vin.ski](https://www.vin.ski) · [ivan@vin.ski](mailto:ivan@vin.ski)
