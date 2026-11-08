# Deploying Sokobanko on Spotcraft

Sokobanko runs at **https://sokobanko.app**, as an app on [Spotcraft](https://spotcraft.dev) 0.2.0, on our own Hetzner servers. Spotcraft runs the app's container behind Caddy on HTTPS, gives it its own Postgres database, and watches it from the dashboard.

- **The image:** `vindotski/sokobanko` on Docker Hub. CI builds it for amd64 and arm64 and publishes it (`.github/workflows/ci.yml`). It has to be public, because Spotcraft's agent doesn't log in to registries.
- **The database:** the app's own, `app_sokobanko`, given to it as `DATABASE_URL`.
  - **Spotcraft's `auth` schema:** guests and sessions, used through `@spotcraft/kit`.
  - **Sokobanko's `public` tables:** `levels` and `progress`.
  - **At boot** the app applies its migrations and syncs `levels` from the `content/levels/*.md` built into the image (`apps/web/server/utils/database.ts`).
- **Guests:** a visitor becomes a guest on their first save, which is a solved level. The session is an HttpOnly cookie that the kit sets, and it lasts a year.

It replaced the demo, which ran on Vercel against Spotcraft's old hosted API at api.vin.ski. The rollout below covers the switch.

## The app in Spotcraft's dashboard

**Add app** (or edit it later) with:

| Field | Value |
| --- | --- |
| Name | `sokobanko` |
| Image | `vindotski/sokobanko` |
| Tag | a `sha-abc1234` tag from CI. `latest` works, but pinning a tag makes rolling back simply picking the previous one. |
| Domain | `sokobanko.app`. On Cloudflare, `A` `2.31.218.181` and `AAAA` `2a01:4f8:c016:3ad0::1` (the **apps** server), DNS only, for both `sokobanko.app` and `www.sokobanko.app`. Spotcraft redirects `www` to the bare domain, and Caddy needs it to resolve for its certificate. |
| Port | `3000` |
| Memory, CPUs | `512m`, `1` |
| Read-only | on (only `/tmp` is writable, which the app needs for nothing but its migrations) |
| Database | **ticked**; Spotcraft sets `DATABASE_URL` |
| Env | `AUTH_SECRET=<openssl rand -hex 32>` and `PUBLIC_URL=https://sokobanko.app` |

- **`AUTH_SECRET`** signs the session cookies. Keep it in the password manager. Changing it signs every guest out, and they lose their progress.
- **`PUBLIC_URL`** must be the address players use, exactly the domain with `https://`. On https the cookie is `Secure`. Saving fails if it doesn't match.
- **Database** must be ticked before the first deploy. Without it there's no `DATABASE_URL`: the container never turns healthy, and the log says "DATABASE_URL must be a postgres:// URL".

The container is healthy once `/api/health` answers, which means the database is migrated, the levels are synced and Postgres responds. Spotcraft's deploy waits for that, and if it doesn't happen within two minutes it restores the previous version. The container is replaced in place, so expect a few seconds of downtime per release.

## Releasing

1. Merge into `main` and push. CI verifies, then pushes `latest` and `sha-<short>`. A `v1.2.3` tag also pushes `1.2.3` and `1.2`.
2. In the dashboard, edit `sokobanko` and pick the new `sha-…` tag. Spotcraft pulls it, restarts the container and waits until it's healthy. If the new one fails, it puts the previous one back.
3. Smoke test (below).

- **Rolling back:** pick the previous tag. Migrations only ever add, so an older image runs on a newer database. Keep it that way: a migration that renames or drops something needs its own plan.
- **Levels:** edit `content/levels/*.md`, then release. A removed level's results are deleted with it.
- **Spotcraft upgrades:** `@spotcraft/kit` X.Y needs Spotcraft X.Y or later (Spotcraft's ADR 0019). Upgrade Spotcraft first, then the kit.

## Smoke test

In a fresh private window:
- **The first visit sets no cookie.** `/play/two-boxes` shows the lock screen.
- **Solving First Push** (→ five times) shows "Your best: 5 moves" and sets the HttpOnly session cookie.
- **After a reload:**
  - `/levels` shows First Push as solved, and `/play` opens Big Room.
  - The profile says "Playing since …".
- **In the dashboard,** the app is healthy and its **Users** tab counts the guest.
- **The browser console** shows no errors.

## Backups

Spotcraft 0.2.0 doesn't back up Postgres yet; its decision 0015 says that's the next decision. Until then the only copy is the apps server's disk, so turn on Hetzner's server backups (`apps_server_backups` in Spotcraft's `infra/hetzner`). The levels are in git; the players' results are what would be lost.

## The rollout (2026-11-08)

From the demo on Vercel (sokobanko.vin.ski) to the app on Spotcraft, on its own domain. Results started fresh: the old guests' sessions belonged to api.vin.ski and couldn't carry over.
- [x] **1. Docker Hub:** the public repository `vindotski/sokobanko`. GitHub (`vindotski/sokobanko`) has the variable `DOCKERHUB_USERNAME` and the secret `DOCKERHUB_TOKEN`.
- [x] **2. Published:** PR #1 merged into `main`. CI published `latest` and `sha-9a6e394` for amd64 and arm64.
- [x] **3. The app:** added with the fields above, on `sokobanko.app`. The first try had no database (see `Database` above). The certificate came on the first request.
- [x] **4. Smoke test** on https://sokobanko.app, over HTTPS with curl:
  - health, the levels, the lock screen and the HttpOnly `Secure` cookie on the first save;
  - a worse run keeping the best, `/play` opening Big Room, and the profile.
  - Still to check in a browser: playing it and the console.
- [ ] **5. sokobanko.vin.ski:** redirect it to https://sokobanko.app, or retire it.
- [ ] **6. Retire:**
  - the Vercel project;
  - on the old Spotcraft at api.vin.ski: revoke Sokobanko's key and remove the `sokobanko` project, and remove Sokobanko's origins from `AUTH_TRUSTED_ORIGINS` if that server keeps running.

The demo on Vercel was tagged `demo`. Its runbook is in git history (this file before the switch).
