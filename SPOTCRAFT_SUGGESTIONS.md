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

## 7. Token storage in the SDK for server-rendered apps
- **What happened:** the auth guide (`SPOTCRAFT_AUTH_INTEGRATION.md`), like the SDK's token mode, keeps the session token in `localStorage`. A server-rendered app like Sokobanko's can't read that while rendering, so the server would render every page as a brand-new guest. `/play` would redirect to the first level, and the lock states would flash. Sokobanko keeps the token in a cookie instead (`sokobanko-token`), which its server forwards to Spotcraft as a bearer token.
- **Suggestion:** a pluggable token store in the SDK's token mode, such as `createClient({ auth: "token", storage: { get, set } })`, with `localStorage` as the default. The guide could mention the cookie route for SSR apps. Exposing `set-auth-token` to browsers worked as-is.

## 8. A restart can bring back an old image
- **What happened:** after Sokobanko's origins were added to `AUTH_TRUSTED_ORIGINS`, `docker compose up -d api` started an `api` image without the auth routes (`No route for GET /v1/auth/get-session`), until it was pulled again. Compose falls back to `${IMAGE:-…:main}`, and CI sets `IMAGE` only while it deploys.
- **Suggestion:** have the deploy write the image it deployed into the server's `.env` (`IMAGE=…:<sha>`), so a manual `up -d` restarts the same version. Or note it in Spotcraft's DEPLOY.md ("Adding a product").

## 9. Scoped keys, so a product's server needn't hold the admin secret
**Done (Spotcraft's decision 50).** Sokobanko's server uses its own key, `files:read,files:write,files:publish` on `sokobanko` only, and the project is private (`SPOTCRAFT_KEY_INTEGRATION.md`).
- **What happened:** Sokobanko keeps each player's best results as content (`progress/<id>.md`). Players are `user`s, who can't write content (decision 45), and API keys aren't built, so Sokobanko's server writes with the instance's `ADMIN_SECRET`. That key can edit and publish every project on api.vin.ski.
- **Suggestion:** the designed secret keys (decision 9), with a scope like `files:write` limited to one project, or one folder (`sokobanko:progress/`).

## 10. An import that leaves other paths alone
- **What happened:** `spotcraft import` makes the project match the folder, so it deletes every file missing from it (`transfer.ts`: `if (!(path in files)) changes.push({ path, delete: true })`). Sokobanko's `sokobanko` project holds both levels from git and players' files written by its server. The CLI's import would have deleted every player's results, and its export would have copied them into git. Sokobanko now has its own `bin/levels-import.ts` and `bin/levels-export.ts`, which touch only `levels/` and `progress/_schema.yaml`.
- **Suggestion:** a path filter, `spotcraft import content --only levels/`, or a mode that writes and never deletes outside the given paths.

## 11. App data for results
- **What happened:** results as content means every new best is a commit on `main`, everyone's results are public, and concurrent saves retry on `CONFLICT`. It works for a demo.
- **Suggestion:** the planned app data (Spotcraft's roadmap, "App data"): private records per player, written by a product's server without a commit each, would replace `progress/` here. Sokobanko would be the first user.

## 12. Roadmap step 13's wording
How Sokobanko is built differs from step 13's text in three places:
- **The client:** levels are read with `fetch`, not the SDK (see 1).
- **Completions:** Supabase is gone. Each player's best results are Spotcraft content in the same project (`progress/<spotcraft-id>.md`), keyed by level slug (`first-push`), the last segment of the level's path.
- **The source of the levels:** they're authored in git and imported, with dashboard edits exported back. Step 13 implies the dashboard is the source.

Everything else in step 13 holds as written: `levels/_schema.yaml` with `title`, `map` and `order`, one file per level, the official levels imported, the Nuxt server reading at runtime with nothing called from the browser, the solution check reading the map from Spotcraft, and the remaining rules kept in `parseLevel`.
