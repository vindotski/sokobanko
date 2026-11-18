# Deploying Sokobanko on Spotcraft

Sokobanko runs at **https://sokobanko.app**, as an app on [Spotcraft](https://spotcraft.dev) 0.5, on our own Hetzner server behind a Cloudflare Tunnel. Spotcraft runs the app's container behind Caddy, gives it its own Postgres database, backs it up, and watches it from the dashboard at https://dash.spotcraft.dev.

- **The image:** `vindotski/sokobanko` on Docker Hub. CI builds it for amd64 and arm64 and publishes it (`.github/workflows/ci.yml`). It has to be public, because Spotcraft's agent doesn't log in to registries.
- **The database:** the app's own, `app_sokobanko`, given to it as `DATABASE_URL`.
  - **Spotcraft's `auth` schema:** guests and sessions, used through `@spotcraft/kit`.
  - **Sokobanko's `public` tables:** `collections`, `levels` and `progress`, plus `app_migrations`, the applied migrations.
  - **At start** the server applies new migrations, built into the image, through the kit (`apps/web/server/plugins/database.ts`). They also write the levels: Postgres is the levels' only source. If that fails, the server exits, so a bad release never goes live.
- **Guests:** a visitor becomes a guest on their first save, which is a solved level. The session is an HttpOnly cookie that the kit sets, and it lasts a year.
- **Headers:** Spotcraft's Caddy adds HSTS, `X-Frame-Options`, `Permissions-Policy` and the rest. The app sends its own Content Security Policy (`apps/web/nuxt.config.ts`).

## The app in Spotcraft's dashboard

**Add app** (or edit it later) with:

| Field | Value |
| --- | --- |
| Name | `sokobanko` |
| Image | `vindotski/sokobanko` |
| Tag | a `sha-abc1234` tag from CI, never `latest`, so a rollback is picking the previous one. CI sets it on every release. |
| Domain | `sokobanko.app`, with **Take over existing DNS records** ticked. Spotcraft points it and `www.sokobanko.app` at the tunnel, and `www` redirects to the bare domain. |
| Port | `3000` |
| Memory, CPUs | `512m`, `1` |
| Read-only | on |
| Database | **ticked**; Spotcraft sets `DATABASE_URL` |
| Env | `AUTH_SECRET=<openssl rand -hex 32>` and `PUBLIC_URL=https://sokobanko.app` |

- **`AUTH_SECRET`** signs the session cookies. Keep it in the password manager. Changing it signs every guest out, and they lose their progress.
- **`PUBLIC_URL`** must be the address players use, exactly the domain with `https://`. Saving fails if it doesn't match.
- **Database** must be ticked before the first deploy. Without it there's no `DATABASE_URL`, and the server exits saying so.

The container is healthy once `/api/health` answers 200: the migrations have run and Postgres responds.

## Releasing

1. Merge `dev` into `main`. CI verifies, pushes `latest` and `sha-<short>`, then deploys `sha-<short>` through Spotcraft's deploy hook and waits until it is live (the `deploy` job). A `v1.2.3` tag also pushes `1.2.3` and `1.2`, but deploys nothing.
2. Smoke test (below).

Spotcraft starts the new version next to the old one and moves traffic once it is healthy, so a release has no downtime. If the new version doesn't turn healthy within two minutes, it is removed, the old one keeps serving, and the `deploy` job fails.

- **Migrations only ever add.** For a few seconds both versions run against the same database, and a rollback runs an older image on a newer database. A migration that renames or drops something needs its own plan.
- **Memory:** both versions run during a release, so the app briefly needs twice its 512 MB.
- **Rolling back:** in the dashboard, edit `sokobanko` and pick the previous `sha-…` tag.
- **Levels:** a migration adds or changes them (README, "Getting started"), then release. Deleting a level deletes its results with it.
- **Versions:** `@spotcraft/kit` has its own version, apart from Spotcraft's (Spotcraft's ADR 0027). A kit release that needs a newer Spotcraft says so in its changelog; then upgrade Spotcraft first.

### The deploy hook

The `deploy` job runs on `main`, and deploys once GitHub's `production` environment has:

- the variable `SPOTCRAFT_HOOK_URL`: `https://dash.spotcraft.dev/hooks/deploy/sokobanko`;
- the secret `SPOTCRAFT_DEPLOY_TOKEN`. In the dashboard, open `sokobanko`, then **Deploy hook → Turn on**, and copy the token. It is shown only once.

**New token** in the dashboard replaces the token at once; update the secret. **Turn off** stops CI deploys. To approve each release, add required reviewers to the `production` environment. The hook can change only the tag, never the image, env or limits.

## Smoke test

In a fresh private window:
- **The first visit sets no cookie.** `/play/two-boxes` shows the lock screen.
- **Solving First Push** (→ five times) shows "Your best: 5 moves" and sets the HttpOnly session cookie.
- **After a reload:**
  - `/levels` shows First Push as solved, and `/play` opens Big Room.
  - The profile says "Playing since …".
- **In the dashboard,** the app is healthy and its **Users** tab counts the guest.
- **The browser console** shows no errors, and no CSP warnings.
- **`curl -I https://sokobanko.app`** shows `content-security-policy` and `x-frame-options: DENY`.

## Backups

- **Every night at 03:00 UTC** Spotcraft dumps `app_sokobanko` to Cloudflare R2, with the app's settings and `AUTH_SECRET`. R2 keeps each backup for 30 days. The app's page in the dashboard shows the last backup; **Back up now** makes one at once.
- **Hetzner's server backups** keep seven daily images of the whole server.

To restore, follow Spotcraft's guide, [Backups and restoring](https://spotcraft.dev/docs/guides/backups). The levels could also be rebuilt from the migrations in git; the players' results are what a lost database would take with it.
