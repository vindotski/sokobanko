Sokoban is built for [Spotcraft](https://spotcraft.dev) ([Deploying on Spotcraft](Deploying-on-Spotcraft.md)), but its image is an ordinary container. This page lists what it needs, so you can run it on any host with Docker: a VPS with Compose, Kubernetes, or a container platform.

## Try it locally

[`self-host/`](https://github.com/vindotski/sokoban/tree/main/self-host) is a whole stack in one Compose file: Postgres, the user pool, the app and Caddy, set up as this page describes, with example legal facts (`legal-facts.json`). From the repository root, with Docker:

```bash
pnpm self-host
```

It builds the image, starts the stack, applies the migrations, and serves the game at <http://localhost:8080>. `pnpm self-host:smoke` runs the smoke test against it (`scripts/smoke.ts`), and `pnpm self-host:down` stops it and deletes its data. CI runs the same test on every pull request, so this page stays true.

Its passwords and secret are fixed and it serves plain HTTP: it's a starting point, not a deployment. Before running it anywhere else, change them, give the Caddyfile your domain instead of `:8080` (Caddy then gets a certificate), set `AUTH_PROTOCOL=https` and `AUTH_ISSUER` to your own name, and put your own details in `legal-facts.json`.

## The image

`vindotski/sokoban` on Docker Hub, for amd64 and arm64:

| Tag | Is |
| --- | --- |
| `X.Y.Z`, `X.Y`, `latest` | A release |
| `sha-<short>` | Any commit on `main` |

You can also build it yourself: `docker build -t sokoban .` from the repository root.

- **Runtime:** a distroless Node 26 image that runs as user `1000:1000`, with no shell. It listens on `PORT` (3000 by default) and works with a read-only root filesystem (only `/tmp` is written, during migrations).
- **Health:** `GET /api/health` answers 200 once Postgres responds, and the image's `HEALTHCHECK` uses it.

## What it needs

1. **Postgres** (Spotcraft uses 18), with one database that holds:
   - the schema `app_sokoban`, created beforehand and owned by the app's role. The migrations don't create it, and the app's tables are always qualified with this name.
   - the user pool's schema `auth`, owned by the pool's role. `app_sokoban.progress` has a foreign key to `auth.users`, so both schemas must be in the same database.
2. **A user pool** answering at `/_spotcraft/auth` **on the app's own domain**, so its session cookie is first-party.
3. **A reverse proxy** in front of both, for TLS. It sends `/_spotcraft/auth/*` to the pool, serves the legal facts (a JSON file in facts schema v1) at `/_spotcraft/legal.json`, and sends everything else to the app. Without the facts, the legal pages say they can't be shown.

## The user pool

The pool is a guest login: Better Auth with anonymous users, which issues JWTs the app checks. On Spotcraft it is Spotpass (`kodentuzo/spotpass`). `self-host/` still runs the pool that Spotcraft 0.9.1 shipped, `vindotski/spotcraft` (Apache-2.0), which has the same guest routes. Its settings are the starting point elsewhere:

| Setting | Value |
| --- | --- |
| Image and command | `vindotski/spotcraft:0.9.1` with working directory `/app/auth` and command `src/index.ts`. Pin it by digest, as `self-host/compose.yaml` does. |
| `PORT` | `3000` |
| `AUTH_DATABASE_URL` | A login role (`spotcraft_auth`) that owns the `auth` schema in the shared database |
| `AUTH_SECRET` | A long random secret. Keep it: changing it signs everyone out. |
| `AUTH_ISSUER` | The pool's name in its tokens, e.g. `https://sokoban.example/pools/main`. It's a name, not an address. |
| `AUTH_PROTOCOL` | `https` behind TLS (`http` only for local development) |
| Health | `GET /health` |

`AUTH_LOCAL_ORIGINS=1`, which the local stack sets, trusts development servers. Leave it out in production.

This is not a deployment mode Spotcraft documents. Moving the stack to Spotpass 0.2 is not done yet.

## The app's settings

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The app's role in the shared database. Its search path should be `app_sokoban`. |
| `AUTH_URL` | Where the **server** reaches the pool, e.g. `http://pool:3000/_spotcraft/auth` on the internal network |
| `AUTH_ISSUER` | The pool's `AUTH_ISSUER` |
| `AUTH_JWKS_URL` | The pool's keys, e.g. `http://pool:3000/_spotcraft/auth/jwks` |
| `PORT` | Optional; 3000 by default |
| `NUXT_PUBLIC_SITE_URL` | The site's address, for canonical links and the sitemap |
| `PUBLIC_URL` | The site's own address (Spotcraft sets it). The server reads the legal facts from `<PUBLIC_URL>/_spotcraft/legal.json`. |
| `LEGAL_URL` | Optional: where to read the legal facts instead, such as the proxy's address on the internal network. |

The browser always uses `/_spotcraft/auth` on the page's own origin, which is why the proxy route is needed.

## Migrations

Run the migrations once per release, before the new version starts, with the same image and `DATABASE_URL`:

```bash
docker run --rm -e DATABASE_URL=… vindotski/sokoban:X.Y.Z /nodejs/bin/node .output/server/index.mjs migrate
```

They're applied under an advisory lock, so running them twice at once is safe. They also write the levels: a fresh database gets every level on its first migration. The image's `dev.spotcraft.migrate` label holds the same command, for platforms that read it.

As on Spotcraft, migrations only ever add, so an older image can still run against a newer database during a rolling update or a rollback.

## Without the pool

The game still runs without a user pool: every level plays, and progress is kept in the browser. Nothing is verified or saved on the server: the solved dialog says the result is kept on this device until it can sync. The server logs that it can't reach the pool. Postgres is still needed, for the levels.

## Checking it works

Follow the smoke test in [Deploying on Spotcraft](Deploying-on-Spotcraft.md#smoke-test). In a fresh private window, solving First Push should create a guest (`/_spotcraft/auth/sign-in/anonymous`), and after a reload the map should show it as solved.
