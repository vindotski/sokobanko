# Deploying Sokobanko on Spotcraft

Sokobanko runs as an app on [Spotcraft](https://spotcraft.dev) 0.2.0, on our own Hetzner servers. Spotcraft runs the app's container behind Caddy on HTTPS, gives it its own Postgres database, and watches it from the dashboard.

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
| Domain | `sokobanko.vin.ski`. Its `A` and `AAAA` records point at the **apps** server, DNS only on Cloudflare. |
| Port | `3000` |
| Memory, CPUs | `512m`, `1` |
| Read-only | on (only `/tmp` is writable, which the app needs for nothing but its migrations) |
| Database | **ticked**; Spotcraft sets `DATABASE_URL` |
| Env | `AUTH_SECRET=<openssl rand -hex 32>` and `PUBLIC_URL=https://sokobanko.vin.ski` |

- **`AUTH_SECRET`** signs the session cookies. Keep it in the password manager. Changing it signs every guest out, and they lose their progress.
- **`PUBLIC_URL`** must be the address players use. On https the cookie is `Secure`.

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

## The rollout (2026-11)

From the demo on Vercel to the app on Spotcraft. Results start fresh: the old guests' sessions belonged to api.vin.ski and can't carry over.
- [ ] **1. Docker Hub:** create the public repository `vindotski/sokobanko`. In GitHub (`vindotski/sokoban`), add the variable `DOCKERHUB_USERNAME` and the secret `DOCKERHUB_TOKEN` (a Docker Hub access token with read and write).
- [ ] **2. Publish:** merge into `main` and push. CI publishes `latest` and `sha-…`.
- [ ] **3. Add the app on a temporary domain:**
  - Use the dashboard fields above, but with `sokobanko-next.vin.ski` as the domain and in `PUBLIC_URL`.
  - Its `A` and `AAAA` records point at the apps server, DNS only.
  - The certificate arrives on the first request.
- [ ] **4. Smoke test on the temporary domain.**
- [ ] **5. Switch:**
  - Set the app's domain and `PUBLIC_URL` to `sokobanko.vin.ski`.
  - Replace the domain's `CNAME` to Vercel with `A` and `AAAA` records for the apps server (DNS only).
  - Run the smoke test again once DNS has moved. Guests from the temporary domain don't carry over, because a cookie belongs to its domain.
- [ ] **6. Retire:**
  - Remove the `sokobanko-next.vin.ski` records and the Vercel project.
  - On the old Spotcraft at api.vin.ski, revoke Sokobanko's key and remove the `sokobanko` project. Also remove Sokobanko's origins from its `AUTH_TRUSTED_ORIGINS`, if that server keeps running.

The demo on Vercel was tagged `demo`. Its runbook is in git history (this file before the switch).
