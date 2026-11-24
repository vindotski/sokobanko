Sokoban runs at **https://sokoban.game**, as an app on [Spotcraft](https://github.com/kodentuzo/spotcraft) 0.21, on vin.ski's own server. Spotcraft runs the app's container behind Caddy, gives it a schema in its Postgres and its accounts, runs its migrations, backs it up, and serves its legal facts. It is managed in [Studio](https://github.com/kodentuzo/studio), at the instance's Studio address. The old address, sokobanko.app, is not used any more.

- **The image:** `vindotski/sokoban` on Docker Hub, and the same image on the instance's registry, `registry.vin.ski/sokoban` (Spotdeck). CI builds it for amd64 and arm64 and publishes it (`.github/workflows/ci.yml`). Spotcraft pulls only from its own registry.
- **The database:** the schema `app_sokoban` in the instance's `apps` database, given to it as `DATABASE_URL` (its role's search path is the schema). It is a fresh database: nothing was moved from sokobanko.app.
  - **Sokoban's tables:** `collections`, `levels` and `progress`, plus `__drizzle_migrations`, the applied migrations.
  - **The migrations** run before a new version starts: Spotcraft runs the image's `dev.spotcraft.migrate` label, `node .output/server/index.mjs migrate` (`server/plugins/database.ts`). They also write the levels: Postgres is the levels' only source. If they fail, the new version never starts.
- **Guests:** the instance's `accounts` slot (Spotpass) answers at `/_spotcraft/auth` on the app's own domain. When a player first solves a level, the browser makes them a guest there with Better Auth's client, and the pool sets an HttpOnly cookie. Before the player's first click on a level, nothing is stored and no guest exists. The server reads the cookie with `@kodentuzo/spotkit` (`AUTH_URL`, `AUTH_ISSUER`, `AUTH_JWKS_URL`, which Spotcraft sets). `progress.user_id` points at `auth.users`: deleting a guest deletes their results.
- **The legal facts:** who runs Sokoban, set once in Studio's legal tab, and what the instance's modules do with data. The server reads them from `/_spotcraft/legal.json` on its own address (`PUBLIC_URL`, which Spotcraft sets) and renders the privacy notice, terms and legal notice from them. Nothing about the owner is in this repository, and the app has no `LEGAL_FACTS` setting any more.
- **Visits** are counted by the instance's analytics slot, one way: the script (`/_spotcraft/s.js`) sets no cookie and stores nothing on the device. The app loads it and has no setting for it.
- **Headers:** Spotcraft's Caddy adds HSTS, `X-Frame-Options`, `Permissions-Policy` and the rest. The app sends its own Content Security Policy (`nuxt.config.ts`).

## The app in Studio

**Add app** with:

| Field | Value |
| --- | --- |
| Name | `sokoban` (it names the schema `app_sokoban`, and can't change: a new name is a new app) |
| Image | `registry.vin.ski/sokoban`, with no tag. The app is saved and waits for its first release. |
| Tag | Set by the first release from CI, a version such as `0.9.0`. A rollback is releasing the previous one. |
| Domain | `sokoban.game`. Point its `A` and `AAAA` records at the server (Cloudflare's proxy off, if it is there). `www.sokoban.game` redirects to it. The address `sokoban.vin.ski` then answers with a redirect (308) to the domain. |
| Port | `3000` |
| Memory, CPUs | `512m`, `1` |
| Read-only | on |
| Env | none |

Studio's app page shows whether the domain's records point at the server. Caddy gets the certificate on the first request.

Spotcraft sets `PORT`, `PUBLIC_URL`, `APP_NAME`, `DATABASE_URL`, `DATABASE_SCHEMA` and the `AUTH_*` settings itself. The container is healthy once `/api/health` answers 200: Postgres responds.

## CI

On a `v*` tag, the `deploy` job copies the version's image from Docker Hub to the registry (`registry.vin.ski/sokoban:0.9.0`), then calls the app's deploy hook with `{"tag": "0.9.0"}` and waits until it is live. It uses the `production` environment, which only accepts `v*.*.*` tags, and does nothing until it has all four settings.

1. **The push token.** Studio shows it when you add the app. A new one, which stops the old one, comes from `curl -fsS -X POST https://dash.vin.ski/v1/slots/registry/admin/repositories/sokoban/push-token -H "Authorization: Bearer $SPOTCRAFT_API_TOKEN"`. It is shown once and reaches only `registry.vin.ski/sokoban`.
2. **The deploy hook.** On the app's page, turn **Deploy hook** on and copy the token. It is shown only once, and **New token** replaces it at once.
3. **Set them,** from a checkout of this repository, with the GitHub CLI (each `gh secret set` asks for the value):

```bash
gh secret set SPOTCRAFT_PUSH_TOKEN --env production
gh secret set SPOTCRAFT_DEPLOY_TOKEN --env production
gh variable set SPOTCRAFT_REGISTRY --env production --body registry.vin.ski
gh variable set SPOTCRAFT_HOOK_URL --env production --body https://dash.vin.ski/hooks/deploy/sokoban
```

Publishing to Docker Hub needs the repository's variable `DOCKERHUB_USERNAME` and secret `DOCKERHUB_TOKEN`, set as before, and a public repository `vindotski/sokoban` there. To approve each release, add required reviewers to the `production` environment.

## Releasing

A release is a version tag; merging to `main` only builds the image (`sha-<short>`). [Contributing](Contributing.md) has the steps.

1. Merge the `chore/release-x.y.z` pull request into `main`, then push a signed `vX.Y.Z` tag on its merge commit.
2. CI verifies, pushes `X.Y.Z`, `X.Y`, `latest` and `sha-<short>` to Docker Hub, copies `X.Y.Z` to the registry, then deploys it through the hook and waits until it is live (the `deploy` job).
3. Smoke test (below).

Spotcraft starts the new version next to the old one and moves traffic once it is healthy, so a release has no downtime. If the new version doesn't turn healthy within two minutes, it is removed, the old one keeps serving, and the `deploy` job fails.

- **Migrations only ever add.** For a few seconds both versions run against the same database, and a rollback runs an older image on a newer database. A migration that renames or drops something needs its own plan.
- **Memory:** both versions run during a release, so the app briefly needs twice its 512 MB.
- **Rolling back:** in Studio, open `sokoban` and release the previous version. The registry keeps each app's 10 newest versions and the live one.
- **Levels:** a migration adds or changes them ([Development](Development.md)), then release. A level that players have solved can't be deleted (`RESTRICT`).
- **Versions:** `@kodentuzo/spotkit` reads the instance as Spotcraft's contract describes it; a Spotkit release that needs a newer Spotcraft says so in its changelog.

## Smoke test

In a fresh private window, with the browser's storage panel open:
- **The first visit stores nothing:** no cookie, no `localStorage`, no IndexedDB. `/play/two-boxes` goes to its card, which says it's locked.
- **Clicking Play on First Push** turns storage on. Solving it (→ five times) makes a guest in the pool (`/_spotcraft/auth/sign-in/anonymous`), shows "Your best: 5 moves", and sets the HttpOnly session cookie.
- **After a reload:**
  - The map shows First Push as solved, and `/play` opens Big Room.
  - Progress says "Playing since …".
- **`/privacy` and `/legal`** show the owner's details, from the legal facts.
- **In Studio,** the app is healthy and the accounts slot counts the guest.
- **The browser console** shows no errors, and no CSP warnings.
- **`curl -I https://sokoban.game`** shows `content-security-policy` and `x-frame-options: DENY`, and `curl -I https://www.sokoban.game` redirects to it.

## Backups

- **Every night at 03:00 UTC** the instance's backups slot (Spotvault) copies the `app_sokoban` schema and the accounts' schema to a bucket, encrypted with the owner's age key, and the bucket deletes them after 14 days. Studio's backups tab shows the last one, and **Back up now** makes one at once.
- **Hetzner's server backups,** if they are on, keep seven daily images of the whole server.

To restore, follow Spotcraft's guide, [Backups and restoring](https://github.com/kodentuzo/spotcraft/blob/main/docs/guides/backups.md). The levels could also be rebuilt from the migrations in git; the players' results are what a lost database would take with it.

Running the same image somewhere other than Spotcraft is covered in [Self-Hosting](Self-Hosting.md).
