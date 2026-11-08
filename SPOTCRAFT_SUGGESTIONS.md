# Suggestions for Spotcraft

What integrating Sokobanko with Spotcraft turned up that Spotcraft could support better. This repository doesn't change Spotcraft. Each entry says what happened here and what could change there.

## Spotcraft 0.2.0 (self-hosted, with the kit)
From moving Sokobanko onto Spotcraft 0.2.0 (`v0.2.0`, `a74a6d3`) as a Nuxt 4 app with `@spotcraft/kit`.

### 1. A guide for Nuxt (Nitro and H3)
- **What happened:** the backend-kit guide covers only SvelteKit, and the kit's browser error names SvelteKit paths. The Nuxt version took some working out (`apps/web/server/middleware/guest.ts`):
  - **The request:** `new Request(getRequestURL(event), { headers: event.headers })`. Avoid `toWebRequest`, which may take the body stream that `readBody` needs later.
  - **The client address:** `getRequestIP(event, { xForwardedFor: true })`.
  - **Cookies:** each `headers.getSetCookie()` goes out through `appendResponseHeader`.
  - **Rate limit:** `GuestLimitError` becomes a 429 with `retry-after`.
  - **Static assets** skip the kit.
- **Suggestion:** a short Nuxt section, or a framework-neutral one with Nuxt as the second example, in `docs/guides/backend-kit.md`.

### 2. The kit reads its migrations folder when imported
- **What happened:** `schema.ts` runs `readdirSync(new URL('./migrations/', import.meta.url))` at import, and the root export pulls it in through `provision.ts`. An app's server only works if its bundler leaves the kit external and copies `dist/migrations/*.sql`. Nitro's tracing does, so Sokobanko is fine, but an inlining bundler would crash at boot.
- **Suggestion:** have the root export not import `provision`, or embed the SQL as strings at build time, so `@spotcraft/kit` reads no files.

### 3. App migrations at boot
- **What happened:** the kit leaves the app's own tables to it, and the guide suggests drizzle-kit. Sokobanko applies its migrations when the server starts. Drizzle's migrator reads a folder, so the bundled migrations are written to `/tmp` first, since the filesystem is read-only.
- **Suggestion:** a documented pattern, or a kit helper that takes the migrations as data, such as `migrateApp(db, migrations)`.

### 4. No way to deploy from CI
- **What happened:** CI publishes `vindotski/sokobanko`, but releasing still means picking the tag in the dashboard. The agent only listens on the private network, and the dashboard has no API tokens.
- **Suggestion:** a scoped deploy token for one app, such as "set this app's tag", callable from CI. Or let an app follow a moving tag and redeploy on a webhook from the registry.

### 5. Public images only
- **What happened:** the agent pulls without logging in, so an app's image has to be public.
- **Suggestion:** per-app registry credentials (or one for the server), for apps that aren't open source.

### 6. Postgres backups
- **What happened:** players' results live only in the app database, and decision 0015 leaves backups as "the next decision". Today the fallback is Hetzner's whole-server backups (`apps_server_backups`, off by default).
- **Suggestion:** nightly `pg_dump` per app database, kept off the server, with a restore command. Or at least the backups variable on by default.

### 7. Small doc fixes
- The dashboard's empty Users tab still says every visitor becomes a guest on their first request. Since `9dfb2a0`, guests are made on the first save.
- ADR 0017's body gives the local Postgres port as 54322, but its notes and the CLI use 54340.
- `spotcraft dev` names the app after `package.json`. In a monorepo that's the workspace package (`@sokoban/web` gives `web`), so `--name` is needed every time. A `spotcraft.name` field in `package.json`, or a hint when the name looks generic, would help.
- `spotcraft dev env --write` writes `DATABASE_URL` and `AUTH_SECRET`, but not `PUBLIC_URL`, which the kit also requires. It could write `http://localhost:3000` or ask for it.

## The earlier hosted API (api.vin.ski)
From the demo, which used Spotcraft's hosted content and app data API. Spotcraft 0.2.0 replaced that API, so these no longer apply. The details are in git history (this file before November 8, 2026):
1. Publish the SDK and the CLI
2. A CLI that runs without a build
3. `spotcraft import` overwrites dashboard edits
4. `ref`, `commit` and ETags in the SDK
5. Knowing when content is published
6. Rules JSON Schema can't express
7. Token storage in the SDK for server-rendered apps
8. A restart can bring back an old image
9. Scoped keys, so a product's server needn't hold the admin secret
10. An import that leaves other paths alone
11. App data for results
12. Roadmap step 13's wording
