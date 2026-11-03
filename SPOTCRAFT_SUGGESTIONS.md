# Suggestions for Spotcraft

What integrating Sokobanko with Spotcraft (its `main` at `a814a62`, and https://api.vin.ski) turned up that Spotcraft could support better. This repository doesn't change Spotcraft. Each entry says what happened here and what could change there.

## 1. Publish the SDK and the CLI
- **What happened:** neither `@spotcraft/sdk` nor `spotcraft` is on npm.
  - The game's server reads the levels with a plain `fetch` (`apps/web/server/utils/levels.ts`) rather than the SDK that step 13 describes.
  - The `levels:*` scripts run the CLI from a `../spotcraft-main` worktree, so any machine that imports levels needs that worktree, with `pnpm install` run in it.
- **Suggestion:** publish them, even as `0.x`. The `fetch` would then become `createClient().content.list()`.

## 2. A CLI that runs without a build
- **What happened:** the CLI's `bin` points at `dist/index.js`, which isn't built in the repository, so the scripts call `node --conditions=source …/src/index.ts`.
- **Suggestion:** a `bin` that runs the TypeScript source directly (Node 26 strips the types), or a published build (see 1).

## 3. `spotcraft import` overwrites dashboard edits
- **What happened:** Sokobanko keeps its levels in git and imports them. An import writes the folder as one commit on `main`, so a level edited in the dashboard since the last import is silently replaced. The workaround is a manual rule: `pnpm levels:export` and commit before every import.
- **Suggestion:** `import` refuses when `main` has commits it didn't make since the last import, unless `--force` is given (as `export` does for folders that aren't empty). Or a sync mode that shows the diff.

## 4. `ref`, `commit` and ETags in the SDK
- **What happened:** delivery supports `?ref=`, `?commit=` and `ETag`, but `content.get` and `content.list` don't expose them. A consumer can't preview a draft, or revalidate cheaply.
- **Suggestion:** an options argument with `ref` and `commit`, and a way to send `If-None-Match`.

## 5. Knowing when content is published
- **What happened:** the game's server caches the levels for a minute, so a published edit shows only after the cache refreshes.
- **Suggestion:** a publish webhook (already on Spotcraft's roadmap), so consumers can drop their cache when content changes.

## 6. Rules JSON Schema can't express
- **What happened:** "exactly one player" and "as many goals as boxes" can't be written in `_schema.yaml`. A level that breaks them passes Spotcraft's checks and gets published, and the game's server skips it (`parseLevel`).
- **Suggestion:** validators (Spotcraft's decision 18) for content folders as well as app collections, so these rules are checked before publishing.

## 7. Roadmap step 13's wording
How Sokobanko is built differs from step 13's text in three places:
- **The client:** levels are read with `fetch`, not the SDK (see 1).
- **Completions:** they're keyed by the level's slug (`first-push`), the last segment of its path, rather than the full path (`levels/first-push`).
- **The source of the levels:** they're authored in git and imported, with dashboard edits exported back. Step 13 implies the dashboard is the source.

Everything else in step 13 holds as written: `levels/_schema.yaml` with `title`, `map` and `order`, one file per level, the official levels imported, the Nuxt server reading at runtime with nothing called from the browser, completions staying in Supabase, the solution check reading the map from Spotcraft, and the remaining rules kept in `parseLevel`.
