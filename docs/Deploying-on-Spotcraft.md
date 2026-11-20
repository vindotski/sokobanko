Sokobanko runs at **https://sokobanko.app**, as an app on [Spotcraft](https://spotcraft.dev) 0.6, on our own Hetzner server behind a Cloudflare Tunnel. Spotcraft runs the app's container behind Caddy, gives it a schema in its Postgres and its user pool, runs its migrations, backs it up, and watches it from the dashboard at https://dash.spotcraft.dev.

- **The image:** `vindotski/sokobanko` on Docker Hub. CI builds it for amd64 and arm64 and publishes it (`.github/workflows/ci.yml`). It has to be public, because Spotcraft's agent doesn't log in to registries.
- **The database:** the schema `app_sokobanko` in Spotcraft's `apps` database, given to it as `DATABASE_URL` (its role's search path is the schema).
  - **Sokobanko's tables:** `collections`, `levels` and `progress`, plus `__drizzle_migrations`, the applied migrations.
  - **The migrations** run before a new version starts: Spotcraft runs the image's `dev.spotcraft.migrate` label, `node .output/server/index.mjs migrate` (`server/plugins/database.ts`). They also write the levels: Postgres is the levels' only source. If they fail, the new version never starts.
- **Guests:** Spotcraft's user pool, shared by the server's apps, answers at `/_spotcraft/auth` on the app's own domain. Before a visitor's first save (a solved level), the browser makes them a guest there with Better Auth's client; the pool sets an HttpOnly cookie that lasts a year. The server reads it with `@kodentuzo/spotkit` (`AUTH_URL`, `AUTH_ISSUER`, `AUTH_JWKS_URL`, which Spotcraft sets). `progress.user_id` points at `auth.users`: deleting a guest in the dashboard's **Users** page deletes their results.
- **Headers:** Spotcraft's Caddy adds HSTS, `X-Frame-Options`, `Permissions-Policy` and the rest. The app sends its own Content Security Policy (`nuxt.config.ts`).

## The app in Spotcraft's dashboard

**Add app** (or edit it later) with:

| Field | Value |
| --- | --- |
| Name | `sokobanko` |
| Image | `vindotski/sokobanko` |
| Tag | a `sha-abc1234` tag from CI, never `latest`, so a rollback is picking the previous one. CI's deploy job sets it on every release. |
| Domain | `sokobanko.app`, with **Take over existing DNS records** ticked. Spotcraft points it and `www.sokobanko.app` at the tunnel, and `www` redirects to the bare domain. |
| Port | `3000` |
| Memory, CPUs | `512m`, `1` |
| Read-only | on |
| Env | none |

Spotcraft sets `PORT`, `PUBLIC_URL`, `DATABASE_URL`, `DATABASE_SCHEMA` and the `AUTH_*` settings itself. The container is healthy once `/api/health` answers 200: Postgres responds.

## Moving to the user pool (once, done)

Before Spotcraft 0.6, Sokobanko had its own database, with its guests in its own `auth` schema. It was moved into Spotcraft's shared Postgres and user pool once, with the dashboard's **Move**, following Spotcraft's [guide](https://spotcraft.dev/docs/guides/move-into-the-pool). The steps are in this page's history in git (`DEPLOY.md` at the `v0.4.0` tag) if they're ever needed again.

## Releasing

A release is a version tag; merging to `main` only builds the image (`sha-<short>`). [Contributing](Contributing.md) has the steps.

1. Merge the `chore/release-x.y.z` pull request into `main`, then push a signed `vX.Y.Z` tag on its merge commit.
2. CI verifies, pushes `X.Y.Z`, `X.Y`, `latest` and `sha-<short>`, then deploys `sha-<short>` through Spotcraft's deploy hook and waits until it is live (the `deploy` job). The `production` environment only accepts `v*.*.*` tags.
3. Smoke test (below).

Spotcraft starts the new version next to the old one and moves traffic once it is healthy, so a release has no downtime. If the new version doesn't turn healthy within two minutes, it is removed, the old one keeps serving, and the `deploy` job fails.

- **Migrations only ever add.** For a few seconds both versions run against the same database, and a rollback runs an older image on a newer database. A migration that renames or drops something needs its own plan.
- **Memory:** both versions run during a release, so the app briefly needs twice its 512 MB.
- **Rolling back:** in the dashboard, edit `sokobanko` and pick the previous `sha-…` tag.
- **Levels:** a migration adds or changes them ([Development](Development.md)), then release. A level that players have solved can't be deleted (`RESTRICT`).
- **Versions:** `@kodentuzo/spotkit` reads the user pool as Spotcraft's contract describes it; a spotkit release that needs a newer Spotcraft says so in its changelog.

### The deploy hook

The `deploy` job runs on version tags, and deploys once GitHub's `production` environment has:

- the variable `SPOTCRAFT_HOOK_URL`: `https://dash.spotcraft.dev/hooks/deploy/sokobanko`;
- the secret `SPOTCRAFT_DEPLOY_TOKEN`. In the dashboard, open `sokobanko`, then **Deploy hook → Turn on**, and copy the token. It is shown only once.

**New token** in the dashboard replaces the token at once; update the secret. **Turn off** stops CI deploys. To approve each release, add required reviewers to the `production` environment. The hook can change only the tag, never the image, env or limits.

## Smoke test

In a fresh private window:
- **The first visit sets no cookie.** `/play/two-boxes` goes to its card, which says it's locked.
- **Solving First Push** (→ five times) makes a guest in the user pool (`/_spotcraft/auth/sign-in/anonymous`), shows "Your best: 5 moves", and sets the HttpOnly session cookie.
- **After a reload:**
  - The map shows First Push as solved, and `/play` opens Big Room.
  - Progress says "Playing since …".
- **In the dashboard,** the app is healthy and the **Users** page counts the guest.
- **The browser console** shows no errors, and no CSP warnings.
- **`curl -I https://sokobanko.app`** shows `content-security-policy` and `x-frame-options: DENY`.

## Backups

- **Every night at 03:00 UTC** Spotcraft dumps the `app_sokobanko` schema to Cloudflare R2, with the app's settings, and the user pool's `auth` schema apart. R2 keeps each backup for 30 days. The app's page in the dashboard shows the last backup; **Back up now** makes one at once.
- **Hetzner's server backups** keep seven daily images of the whole server.

To restore, follow Spotcraft's guide, [Backups and restoring](https://spotcraft.dev/docs/guides/backups). The levels could also be rebuilt from the migrations in git; the players' results are what a lost database would take with it.

Running the same image somewhere other than Spotcraft is covered in [Self-Hosting](Self-Hosting.md).
