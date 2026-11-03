---
title: Roadmap
description: The proof of concept (levels from Spotcraft, then a deploy), then the earlier plan for after it.
---

# Roadmap

**Numbering:** a bare number in parentheses, like "(12)", is one of this repository's [decision records](decisions/README.md). Spotcraft's records are always written out as "Spotcraft's decision N", since the two sets of numbers overlap. Gameplay features are compared in [parity.md](parity.md).

## Proof of concept: Sokobanko on Spotcraft
**The goal:** Sokobanko's levels are defined in Spotcraft, as Markdown with typed front matter, and the game is deployed. Everything else stays as it is: Supabase (guest accounts, server-verified bests), Pinia, the monorepo and every feature. This follows Spotcraft's own plan for Sokobanko, its roadmap, stage 2, step 13. Changes Spotcraft could make to support this better go in [`SPOTCRAFT_SUGGESTIONS.md`](../SPOTCRAFT_SUGGESTIONS.md). The Spotcraft repository isn't changed from here.

### Step 1: Levels from Spotcraft
- [x] `content/levels/`: `_schema.yaml` (`title` and `map` required, up to 50 rows of up to 50 XSB glyphs, and `order`) and one Markdown file per level, named by slug: `first-push`, `big-room`, `two-boxes` and `hello-world`. The files are in git and imported into the `sokobanko` project on https://api.vin.ski. The `levels:check`, `levels:import` and `levels:export` scripts run Spotcraft's CLI from the `../spotcraft-main` worktree.
- [x] Imported: `pnpm levels:import`, with `SPOTCRAFT_API_URL` and `SPOTCRAFT_ADMIN_SECRET` set.
- [x] The Nuxt server reads the published levels with `fetch` (`server/utils/levels.ts`, cached for a minute, stale-while-revalidate), and serves them at `/api/levels`. The browser never calls Spotcraft.
- [x] The completion route takes the level and the play order from that list, checks the unlock rule, replays the solution, and records it in Supabase, keyed by slug.
- [x] Supabase: a migration drops the `levels` table and its check function, and keys `level_completions` by slug. The seed keeps only the demo user.
- [x] Checked in a browser against api.vin.ski, with every feature as before.

### Step 2: Deploy, on Vercel for now
The runbook is [`DEPLOY.md`](../DEPLOY.md), done by hand, once. Moving to the VPS that runs api.vin.ski comes later.
- [x] A Supabase Cloud project: `supabase link`, `db push`, anonymous sign-ins on (no CAPTCHA yet), and the Site URL.
- [x] The Vercel project: Root Directory `apps/web`, Node 26, Corepack for pnpm 12, the Supabase variables, and the domain `sokobanko.vin.ski`.
- [x] The smoke test on the live site.

### Done when
- [x] The live URL works (https://sokobanko.vin.ski): guest play, levels unlocking in order, verified bests saved, the profile.
- [x] The levels come from Spotcraft, locally and on the live site.
- [ ] A level edited and published in the Spotcraft dashboard shows in the game within a minute. That's Spotcraft's step 13 check. Then `pnpm levels:export` brings the edit back into git, since git is the levels' source.

### Later, for the integration
- Show "Spotcraft unavailable" instead of a 404 when the API is down, and return 502 for upstream errors.
- ETag or conditional requests to the API.
- Cache invalidation from a publish webhook (see the suggestions).
- `@spotcraft/sdk` instead of `fetch`, once it's published.
- CAPTCHA (Turnstile) on guest sign-in: its token passed to `signInAnonymously`, and CAPTCHA turned on in Supabase.
- Move from Vercel to the VPS that runs api.vin.ski, deployed from CI.

## After the proof of concept
The plan below was written before the proof of concept was scoped. It covers dropping Supabase, Dexie, flattening, decision records, CI and parity, and it comes after the proof of concept, to be revisited and reordered then. Its phase numbers stay, since [parity.md](parity.md) cites them.

**Its goal was** one Nuxt package with a small Nitro server that serves levels, with progress in the browser's IndexedDB (Dexie), and no accounts, no database of its own and no Pinia.

## Phase 0: Decision records, tooling and early cleanup
- [ ] **Decision records (ADRs), in Spotcraft's format (8).** Run `git show main:docs/decisions/README.md` in `../spotcraft` for the reference.
  - `docs/_schema.yaml`: every page has `title` (required) and `description`. Copy it from Spotcraft's.
  - `docs/decisions/_schema.yaml`: `number`, `status` (`accepted` | `superseded`), `implementation` (`built` | `partly-built` | `designed`, left out for a principle), `date`, `supersedes`, `superseded_by` and `notes`. Copy it from Spotcraft's.
  - `docs/decisions/README.md`: the index table (#, decision, status) and the rules. To change a decision, write a new record with `supersedes`. The old one gets `superseded_by`, and its body isn't rewritten.
  - Each `NNNN-slug.md` has the sections Context, Decision, Alternatives and Consequences.
  - **Checking with Spotcraft's CLI from the start:**
    - **Integrate only with Spotcraft's `main`, through a worktree.** Run `git -C ../spotcraft worktree add ../spotcraft-main main`, then `pnpm install` in `../spotcraft-main`. That worktree is only ever updated with `git pull` on `main`. Work on Spotcraft's `dev` in `../spotcraft` can't leak in. Every `link:` below points at `../spotcraft-main`, and decision 8's notes say so.
    - Dev dependencies: `spotcraft: link:../spotcraft-main/packages/spotcraft` and `@spotcraft/core: link:../spotcraft-main/packages/@spotcraft/core`.
    - A `predev`/CI guard (`bin/check-spotcraft.sh`) fails if `../spotcraft-main` isn't on `main`. It prints the commit, which the decision records' notes cite whenever they depend on Spotcraft behaviour.
    - The CLI's `bin` points at `dist/`, which isn't built in the Spotcraft repo, so call it as `node --conditions=source node_modules/spotcraft/src/index.ts …` (wrapped as `pnpm spotcraft …` in a `spotcraft` script). `levels:check` and the Phase 7 `levels:import`/`levels:export` scripts use that wrapper too.
    - Port `bin/check-docs.ts` from Spotcraft. It runs `checkFolder(docs)` plus the record rule: every `NNNN-*.md` has `number`, `status` and `date`, and the number matches the file name.
    - Wire it up as `docs:check: node --conditions=source bin/check-docs.ts`, and add it to the checks every phase runs.
    - From here on, this repo needs `../spotcraft-main` next to it. CI, which starts in Phase 1, checks out both repos.
    - Only `content/` gets imported into Spotcraft (Phase 7). `docs/` is checked with the same tools, but it stays in this repo.
  - **Records to write up front.** Records for decisions already built are dated from git history. Roadmap decisions start as `implementation: designed`, and each phase flips its own records to `built` (with `notes`) in its own PR:

    | # | Decision | Status |
    | --- | --- | --- |
    | 1 | A pnpm monorepo: `apps/web`, `packages/core`, `packages/game` | Superseded by 10 |
    | 2 | The site is Nuxt 4 + Vue 3, with Tailwind v4 and shadcn-vue | Built |
    | 3 | Game rules are a pure engine: XSB maps, LURD solutions, replay, unlock order (`levelStates`) | Built |
    | 4 | PixiJS v8 draws the board: camera, keyboard and joystick input, celebrations | Built |
    | 5 | Supabase: levels in Postgres, anonymous guests, RLS, completions verified by the server | Superseded by 9, 11, 12 |
    | 6 | Monochrome design, with the Geist typefaces | Built |
    | 7 | Agent skills are vendored through the `skills` CLI (pixijs, shadcn-vue, antfu/skills) | Built |
    | 8 | `docs/` as a Spotcraft content tree: decisions, `roadmap.md` and `parity.md`, checked with Spotcraft's CLI | Built in Phase 0 |
    | 9 | No backend of our own and no accounts for now; progress is local | Designed |
    | 10 | One Nuxt package: `app/lib/sokoban`, `app/lib/game`, one TypeScript, `@nuxt/test-utils` | Designed |
    | 11 | Levels are Markdown with front matter in Spotcraft's format, served by Nitro routes; slugs are ids | Designed |
    | 12 | Progress lives in IndexedDB through Dexie, behind a shared composable; no Pinia | Designed |
    | 13 | Deployed as a Node server, built in CI; host to be decided | Designed |
    | 14 | Levels come from Spotcraft's hosted API through the SDK, read by the Nuxt server and cached; git is their source, imported by CI | Designed |
    | 15 | Accounts, verified bests and leaderboards wait for server validation (Spotcraft Apps/Validators, or another way) | Principle |
    | 16 | Tap to walk and drag a box to push it: pathfinding in the engine, turned into ordinary LURD moves | Designed |
    | 17 | Deadlock warnings: simple dead squares, computed once per level, shown and never enforced | Designed |
    | 18 | Level collections: only freely redistributable sets (Microban first), credited in `author` and the body | Designed |

  - The phase titles below cite these numbers.
- [ ] Install skills from [antfu/skills](https://github.com/antfu/skills), using the same `skills` CLI that wrote `skills-lock.json`:
  `pnpm dlx skills add antfu/skills --skill=nuxt --skill=vue --skill=vitest --skill=pnpm --skill=vite --skill=antfu-simplify --skill=antfu-query --skill=antfu-create-pr`.
  Check that they land in `.agents/skills/`, are symlinked from `.claude/skills/` and appear in the lockfile.
  Skipped: `pinia` (it's being removed), `unocss` (we use Tailwind), `vitepress`, `antfu` (ESLint-based; we use Biome) and `antfu-issue-triage`.
- [ ] Remove the Supabase skills: `.agents/skills/supabase*`, their `.claude/skills/` symlinks and their lockfile entries.
- [ ] `biome.json`: exclude `.agents` so that `pnpm lint` is green, as a baseline for every later phase.
- [x] Notes: retire the Supabase deploy checklist and the stale-session/FK note. This was done when the roadmap was written.
- [ ] **Check this roadmap against the new skills.** Read each skill and test Phases 1–8 against it. Wherever a skill contradicts the plan or offers a better approach, update the roadmap and the affected decision records before starting Phase 1. A record that is still only designed can be edited in place. If one has to be replaced, write a new record that supersedes it. Note what changed and why under "Revisions" at the bottom. What to look for:
  - `nuxt`:
    - Do Nuxt's conventions change the layout: `app/lib/` vs `app/utils/`, `shared/` (now that there is a server, the level parsing could be shared by app and server), the `app/db/` placement, `content/` vs `server/assets/`?
    - Is `onNuxtReady` + `createSharedComposable` right for client-only state?
    - What do Nitro server assets, `defineCachedEventHandler` and the node-server preset need?
  - `vue`: composables that replace Pinia, cleaning up effect scopes, avoiding hydration mismatches.
  - `vitest`: per-file environments with `@nuxt/test-utils`, the `fake-indexeddb` setup, and testing server routes.
  - `pnpm`: collapsing a workspace into one package (`allowBuilds`/`onlyBuiltDependencies`, the lockfile, `packageManager`), and the `link:` dependencies on `../spotcraft-main`.
  - `vite`: does the `cn` resolve plugin still fit after the flatten? What about the `source` export condition, needed from Phase 2?
  - All skills: does `docs/parity.md` or Phase 8 change anything? For example, `vue`/`nuxt` patterns for the play UI.
  - `antfu-simplify`: which steps or abstractions can go? For example, `useLiveQuery`, or the separate `server/utils/levels.ts`.
  - `antfu-query`: use it to settle any decisions still open with the user.
  - `antfu-create-pr`: use its commit and PR conventions for every phase.

Every later phase ends by flipping its decision records to `implementation: built`, adding `notes` where needed, and updating the index.

## Phase 1: Flatten into a single Nuxt app (10)
Done in place with `git mv` so history survives. Commit order: moves, then config, then import rewrites.

**Target layout**
```
app/                 (was apps/web/app)
  lib/sokoban/       (was packages/core/src: rules, parser, replay + tests)
  lib/game/          (was packages/game/src: PixiJS renderer, input, camera)
server/              (was apps/web/server)
public/  supabase/ (until Phase 4)  nuxt.config.ts  package.json
tsconfig.json  vitest.config.ts  biome.json  components.json
```
- [ ] Moves:
  - `git mv apps/web/{app,public,server,nuxt.config.ts,components.json,tsconfig.json} .`
  - `git mv packages/core/src app/lib/sokoban`
  - `git mv packages/game/src app/lib/game`
  - Move `.env.example` and the local `.env` to the root, and merge `apps/web/.gitignore` into the root `.gitignore`.
  - Delete `apps/`, `packages/`, `pnpm-workspace.yaml` and `tsconfig.base.json`. Keep `allowBuilds` (esbuild, and supabase until Phase 4) in `package.json`.
- [ ] One `package.json`, named `sokobanko`:
  - Dependencies: the web app's (still with `@nuxtjs/supabase` and `@pinia/nuxt` for now) plus `pixi.js`.
  - Keep `packageManager: pnpm` and `engines.node >=26`.
  - Scripts: `dev`, `build`, `preview`, `postinstall: nuxt prepare`, `typecheck: nuxt typecheck`, `test`, `lint`, `format`, `docs:check`, and `db:types` writing to `app/types/`. Keep the Phase 0 `link:` dev dependencies on `../spotcraft-main`.
  - Drop the `workspace:*` deps and `@types/web`.
- [ ] TypeScript: use one version that `vue-tsc` supports (the root uses TS 7 and the web app TS 6 today). Move the strict base flags (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`) into `typescript.tsConfig.compilerOptions`, and fix whatever they surface.
- [ ] Imports:
  - Rewrite `@sokoban/core` → `~/lib/sokoban` and `@sokoban/game` → `~/lib/game`. `lib/game` imports `../sokoban` relatively.
  - Strip the `.ts` import suffixes.
  - `lib/` isn't auto-imported; keep it that way.
- [ ] Tests: add `@nuxt/test-utils` and switch `vitest.config.ts` to `defineVitestConfig`. Engine tests run in node; composable and component tests opt into the `nuxt` environment.
- [ ] `biome.json`: update the paths (`!app/components/ui`, `app/pages/**`, `app/layouts/**`, `app/app.vue`).
- [ ] **CI for the checks**, in `.github/workflows/ci.yml`. The repo has no CI yet; this phase adds it, now that there's a single package. It runs on pushes and PRs:
  - Check out this repo into `$GITHUB_WORKSPACE/sokobanko` and `vindotski/spotcraft@main` into `$GITHUB_WORKSPACE/spotcraft-main`. `actions/checkout` can't write outside the workspace, so this keeps the relative `link:` paths working.
  - `pnpm install` in both.
  - Run `check-spotcraft`, `typecheck`, `test`, `lint` and `docs:check`, plus `levels:check` once Phase 2 adds it.
- [ ] Check: `rm -rf node_modules && pnpm install`, then `typecheck`, `test`, `lint`, `docs:check` and `dev` from the root, with CI green. The app still runs on Supabase.

## Phase 2: Levels as Markdown in Spotcraft's format, served by Nitro (11)
The files and schema match Spotcraft's roadmap step 13, so Phase 7 imports them unchanged. Spotcraft's core and CLI are already linked (Phase 0), so they parse and check the files from the start.
```
content/levels/_schema.yaml    JSON Schema as YAML: title (required), map (required), order
content/levels/first-push.md   front matter + optional Markdown description
server/utils/levels.ts         read + parse + sort; validates with parseLevel()
server/api/levels/index.get.ts list: [{ id, title, map, order }] in play order
server/api/levels/[id].get.ts  one level, or 404
```
- [ ] `content/levels/_schema.yaml`, following Spotcraft's schema rules (Spotcraft's decision 8): `type: object`, only `properties`/`required` at the top, no `$ref`.
  - `title`: a string, 1–80 characters.
  - `map`: an array of 1–50 strings, each matching `^[ #.$@*+]{1,50}$`.
  - `order`: an integer.
- [ ] One `.md` per level, named by slug: `first-push`, `big-room`, `two-boxes`, `hello-world`.
  - `order` is the current play order (First Push 1, Big Room 2, Two Boxes 3, Hello World! 4).
  - Move the "Hello World!" attribution (DoctorLai/sokoban-web, MIT) into its body.
  - The slug is the level id from now on.
- [ ] `server/utils/levels.ts`:
  - Load the files through Nitro server assets (`nitro.serverAssets` → `useStorage("assets:levels")`), and parse them with `parse` from `@spotcraft/core`, the same parser the API uses.
  - Move `@spotcraft/core` from the dev dependencies to the dependencies.
  - It's TypeScript source exported under the `source` condition. Add `source` to Nitro's `exportConditions`, Vite's `resolve.conditions` and TypeScript's `customConditions`, then check that `nuxt build` bundles it into `.output`.
  - Rules the schema can't express (one player, goals = boxes) go through `parseLevel()`. A level that fails is logged and skipped.
  - Sort by `order`, then by id.
- [ ] Server routes as above. `useLevels`, `useLevelIds` and `useLevel` in `app/composables/levels.ts` switch to `useFetch("/api/levels…")` and keep their return shapes. Drop the UUID regex.
- [ ] `levels:check`: `pnpm spotcraft check content`, which checks the files against `_schema.yaml` the same way the API will. Add it to the checks every phase runs, like `docs:check`.
- [ ] Tests:
  - Every file parses, passes `parseLevel()` and has a unique id and order.
  - Each level's known solution, kept in the test rather than the content (published content is public), replays to `solved`.
  - This replaces `is_valid_level_map` and `levels.test.sql`.
- [ ] Gap until Phase 3: Supabase's `level_completions` is keyed by level UUIDs, and its foreign key points at the `levels` table, so saving a completion fails once ids are slugs. Don't build a bridge for it. Phases 2 and 3 go in one PR, and Phase 3 removes that save path.

## Phase 3: Progress on Dexie, Pinia removed (12)
```
app/
  db/index.ts                 Dexie subclass + schema; client-only singleton
  composables/useLiveQuery.ts Dexie liveQuery → Vue ref (no rxjs)
  composables/progress.ts     useProgress(): best, completions, ready, record(), reset()
  (stores/ deleted)
```
**Why no Pinia:** the only store is `stores/progress.ts`, and Pinia's benefit there was putting `best` in the SSR payload. Dexie data exists only on the client, so there is nothing to serialize. `createSharedComposable` from `@vueuse/core` (already a dependency) gives one subscription and one state across the app.
- [ ] Add `dexie`, and `fake-indexeddb` as a dev dependency.
- [ ] `app/db/index.ts`: `version(1).stores({ completions: "&levelId, completedAt" })`. A row is `{ levelId, moves, pushes, solution, completedAt }`, one best per level, keyed by slug. `getDb()` creates the database lazily and throws on the server.
- [ ] `useLiveQuery(fn, initial)`: subscribe in `onNuxtReady`, so `ready` only flips after hydration, and unsubscribe when the scope is disposed.
- [ ] `useProgress()`:
  - `best`.
  - `completions`, joined with level titles, newest first. This replaces `useCompletions()`.
  - `record(level, solution, order)`: reject the run if the level is locked (`levelStates`) or isn't solved (`replay(parseLevel(level), solution)`). In a transaction, keep the existing row unless the new run has fewer moves, as `record_level_completion()` did. It returns `{ moves, pushes, best }`.
  - `reset()`.
- [ ] Callers:
  - `PlayButton.vue`, `levels/index.vue`, `play/[id].vue`, `play/index.vue` and `profile.vue` switch from `useProgressStore()` + `useAsyncData("completions", …)` to `useProgress()`.
  - `play/[id].vue` calls `await record(...)` instead of `$fetch('/api/levels/:id/complete')`. Keep the pending/verified/failed UI.
- [ ] `play/index.vue`: redirect to the next unsolved level on the client, once `ready`. Show the "solved every level" card and confetti only when `ready` is true and everything is solved.
- [ ] Hydration: gate everything that depends on progress on `ready`, with neutral placeholders. Never flash "Locked" or "Start".
- [ ] `profile.vue` becomes a local "Your progress" page with "Reset progress" behind a confirm dialog. Renaming it to `/progress` is optional.
- [ ] Remove `@pinia/nuxt`, `pinia` and `stores/`.
- [ ] Tests (nuxt environment + `fake-indexeddb/auto`): best-only merge, rejecting unsolved and locked runs, and reset.

## Phase 4: Remove Supabase (9)
- [ ] Auth: delete `app/plugins/anonymous-auth.client.ts` and any leftover `useSupabaseUser()`. In `SiteHeader.vue`, replace the account name with a "Progress" link.
- [ ] Server: delete `server/api/levels/[id]/complete.post.ts`. The level routes stay.
- [ ] Build:
  - Remove `@nuxtjs/supabase`, with its module and its `supabase: {}` config.
  - Remove the `supabase` dev dependency, its `allowBuilds` entry and `db:types`.
  - Delete `app/types/database.types.ts` and the Supabase variables in `.env` and `.env.example`. If nothing is left, delete both files; Phase 7 brings `.env.example` back with `NUXT_SPOTCRAFT_URL`.
- [ ] Delete `supabase/`. Git history keeps it.
- [ ] `pnpm install`. `git grep -i supabase` should now only hit docs.

## Phase 5: Deploy as a Node server (13)
- [ ] **Decision:** choose the host, and record it in 13. It has to run Node 26 (`engines`), with HTTPS and a stable URL. The options are the VPS behind api.vin.ski (Spotcraft's decision 44) or a Node PaaS.
  - Installing needs `../spotcraft-main`, so **nothing is built on the host.** A deploy job added to the Phase 1 CI runs after the checks pass on `main`: it builds and ships `.output/`.
- [ ] `nuxt build` (node-server preset), then run `node .output/server/index.mjs` behind HTTPS.
- [ ] Smoke test on the live URL:
  - Solving First Push saves a best that survives a reload.
  - Level 3's URL shows the lock screen.
  - `/play` sends you to the next unsolved level.
  - Reset clears everything.
  - No hydration warnings appear.

## Phase 6: Docs
- [ ] Update `README.md` (rewritten before Phase 0) to the state after Phase 4:
  - Drop the "until Phase 4" notes, Docker and the Supabase scripts.
  - Layout: the single-package tree (`app/`, `app/lib/sokoban`, `app/lib/game`, `server/`, `content/levels/`, `docs/`).
  - Getting started: the `../spotcraft-main` worktree setup, and the `docs:check` and `levels:check` scripts.
  - Explain how to add a level, and that progress is kept in IndexedDB.
  - Add the live URL and screenshots from the live site.
- [ ] `faq.vue`: update the tech stack, and add that progress is saved in this browser only.
- [ ] `../SOKOBANKO_CASE_STUDY.md`: why the backend and the monorepo were dropped.

## Phase 7: Levels from Spotcraft (14)
This is Spotcraft's roadmap step 13. Spotcraft already hosts an empty `sokobanko` project at https://api.vin.ski (its step 12), and reads there are open. The Nuxt server reads levels through `@spotcraft/sdk` at runtime, so the browser never calls the API: no CORS and no keys. The user updates Spotcraft's own docs separately.
- [ ] `.env.example` gets `NUXT_SPOTCRAFT_URL=https://api.vin.ski`.
- [ ] Add the `@spotcraft/sdk` dependency as `link:../spotcraft-main/packages/@spotcraft/sdk`, since it isn't on npm yet. It's resolved the same way as core (Phase 2's `source` condition), and CI already checks out both repos.
- [ ] Import:
  - With `SPOTCRAFT_API_URL` and `SPOTCRAFT_ADMIN_SECRET` set (read without echoing, as Spotcraft's README shows), run `pnpm spotcraft import content --project sokobanko`, as a `levels:import` script.
  - Check that `levels/first-push` and the others answer at `/v1/projects/sokobanko/content/levels/`.
- [ ] `server/utils/levels.ts` reads from the API instead of server assets:
  - `createClient({ url: useRuntimeConfig().spotcraftUrl })`, with `NUXT_SPOTCRAFT_URL` defaulting to https://api.vin.ski.
  - `content.list("sokobanko", "levels")` for the list. Its `data` already holds `title`, `map` and `order`, so one call is enough.
  - `content.get(...)` for one level. Its `body` is the optional description, for later.
  - The ids are the last path segment, so they match the Phase 2 slugs and the Dexie rows carry over unchanged.
  - Keep the `parseLevel()` filtering for rules that JSON Schema can't express, until Spotcraft's Validators (Spotcraft's decision 18).
- [ ] Caching only: the level routes become `defineCachedEventHandler` with a short `maxAge` and stale-while-revalidate. A published edit shows within that window, without a rebuild. A cold start with the API down returns an error page.
- [ ] **Levels flow from the repo to Spotcraft.** `content/levels/` in git stays the source of truth, the way Spotcraft's own `docs/` works.
  - A CI job runs `levels:import` on pushes to `main` that change `content/levels/`, after the checks, with `SPOTCRAFT_ADMIN_SECRET` stored as a CI secret.
  - The import writes the folder as one commit, so a dashboard edit that isn't in git gets overwritten by the next import. Rule: anything edited in the dashboard is first brought back with `levels:export` (`pnpm spotcraft export content --project sokobanko --force`) and committed.
  - Record this rule, and how it differs from Spotcraft's step 13 (dashboard-first), in decision 14.
- [ ] Docs: the README (levels come from Spotcraft; the repo is the source; the `levels:*` scripts; the `../spotcraft-main` worktree), the FAQ tech stack and the case study.
- [ ] **Decision, after this phase (a new record, next free number):** whether and how refreshes are triggered (cache TTL only, a purge endpoint, a Spotcraft publish webhook later).
- [ ] Check (Spotcraft's "done when" for step 13):
  - In the dashboard against the hosted API, edit a level on a draft, see a check problem, fix it, publish, and see the change in the game within the cache window.
  - Then run `levels:export`, commit, and push. CI's import should be a no-op.
  - Also check the repo path: change a level in git, push, and see CI import it and the game show it.

## Phase 8: Gameplay parity
Each item closes a ⏳ gap in [parity.md](parity.md) and cites its row. Items that need accounts or server validation are under **Later** instead.
Roughly in order of value for the effort. Cheap items come first; they touch only the engine and the play page.
- [ ] **Show each level's description**, its Markdown body. Render core's mdast on the server with `mdast-util-to-hast` + `hast-util-to-html`, the way Spotcraft's `apps/web` does. The "Hello World!" attribution shows through it. (Parity: level metadata.)
- [ ] **Keyboard undo, redo and restart:** Z or U for undo, Y for redo, R for restart, all ignored while typing or in a dialog, like movement. **Redo** keeps the undone steps until a new move is made. (Parity: redo; keyboard undo, redo and restart.)
- [ ] **Resume a half-played level:** keep the current LURD per level in Dexie, as a second table, `snapshots: "&levelId"`. Replay it when the level opens; it's cleared by restart and by solving. (Parity: resume.)
- [ ] **Replay and copy a solution:** the progress page plays back a stored best step by step through `replay`, and copies it as LURD. (Parity: replay; copy a solution.)
- [ ] **Paste an XSB level to play it:** a "Play your own" page parses pasted XSB (`-` and `_` accepted as floor, in `parseLevel`). It's played locally and never stored as an official level or result. (Parity: paste an XSB level; XSB floor characters.)
- [ ] **Tap to walk, drag a box to push it (16):** a breadth-first search over floor cells for the player, and over box positions for a push, in `app/lib/sokoban`, returning LURD. The game plays it as ordinary steps, so counters, undo and replay don't change. (Parity: tap to walk; drag a box.)
- [ ] **Deadlock warnings (17):** precompute the dead squares, where a box can never reach a goal (corners and dead edges), when the level loads. Mark a box pushed onto one, without blocking the move. (Parity: deadlock warnings.)
- [ ] **Screen readers:** a polite live region announces moves, pushes, solves and warnings, and the canvas gets a label. (Parity: screen readers.)
- [ ] **Sound:** step, push, goal and solve sounds, muted by default, with a toggle that remembers its setting. (Parity: sound.)
- [ ] **Microban (18):** add an `author` field to `content/levels/_schema.yaml`, credit David W. Skinner on each level (author and body), and import a first set through `levels:import`. This needs `-`/`_` floors to be accepted (above), and level grouping (`order` ranges or a `collection` field), which is decided in 18. (Parity: well-known collections.)
- Not planned, with reasons in parity.md: a timer, variants, reverse mode, hints and a solver, ads. Accounts, leaderboards, a level editor and shared levels are under Later (15).
- **Constraints, so the Spotcraft integration still holds:**
  - Use only what Spotcraft's `main` offers: `content.list`/`content.get` (the SDK has no `?ref=` or `?commit=` options yet), management through the CLI, and the dashboard. Anything that needs more goes under Later, with the Spotcraft stage it waits for.
  - New level fields (author, difficulty, …) are changes to `content/levels/_schema.yaml`. Every existing level must still pass `levels:check`, and the change lands through `levels:import`, so the hosted project's protected `main` (which only takes passing commits) accepts it.

## End state after Phase 8: matches Spotcraft's `main`
Checked against `../spotcraft-main`'s roadmap, stage 2, step 13:
- [ ] The `sokobanko` project on api.vin.ski holds `levels/_schema.yaml` (`title` and `map` required, up to 50×50 XSB, plus `order`) and one Markdown file per official level, with the description as its body. All of it passes Spotcraft's checks.
- [ ] The game's Nuxt server reads the published levels through `@spotcraft/sdk` at runtime, and the browser never calls the API.
- [ ] Rules that JSON Schema can't express stay in `parseLevel`. Solutions are never stored as content.
- [ ] A level edited and published in the dashboard shows in the game (then gets exported back to git, decision 14).
- [ ] The SDK, core and CLI are linked from Spotcraft's `main` (`../spotcraft-main`), at the commit cited in decision 14's notes.
- Known differences from step 13, recorded in decisions 12 and 14 (the user updates Spotcraft's docs):
  - Progress is stored in the browser (Dexie), not in Supabase.
  - There is no server-side solution check until Later (15).
  - Git is the source of the levels.

## Later: needs server validation (15)
Accounts, cross-device progress, server-verified bests, leaderboards and player-made levels. All of these wait until **Spotcraft supports them** or **we pick another way to validate on a server** (decided then). The pieces as Spotcraft designs them:
- **Apps (Spotcraft's decision 15, its stage 4):**
  - Sokobanko is registered as an app.
  - Anonymous players get a bearer token (`POST /v1/apps/{app}/anonymous`), and sign-in uses OAuth 2.1/OIDC with PKCE.
  - Saves and scores go in `data` collections.
  - When a player signs up, their records move to the real account.
- **Validation:** either a Spotcraft **collection validator** (Spotcraft's decision 18: a sandboxed QuickJS file that replays the solution with our rules), or our own Nitro route that replays the run with `~/lib/sokoban` and writes with a `server`-access secret key (the anti-cheat in Spotcraft's decision 15).
- **Moving progress over:** on first sign-in, upload the local Dexie bests and verify them like new runs.
- **Leaderboards:** read from verified records, per level.
- **Player-made levels:** drafts on Spotcraft branches, published through checks. This needs accounts and roles (Spotcraft's stage 3).
- The Supabase schema in git history (`level_completions`, `record_level_completion`) is a reference for the rules.


## Revisions

Changes to this roadmap after it was first written, and why. Phase 0's review against the new skills adds its findings here.
