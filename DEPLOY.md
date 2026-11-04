# Deploying the demo (Vercel and Spotcraft)

https://sokobanko.vin.ski runs on **Vercel** for now. Everything it stores is on Spotcraft's hosted API (https://api.vin.ski), in the `sokobanko` project:
- **the levels:** `levels/*.md`, imported from this repository;
- **the guests:** Spotcraft accounts (Spotcraft's decisions 45 and 47);
- **each player's best results:** `progress/<id>.md`, written by Sokobanko's server.

There's no database of its own. Moving to the VPS that runs api.vin.ski is the proof of concept ([roadmap](docs/roadmap.md)).

The demo first ran with Supabase for guests and results (tagged `demo`). Both moved to Spotcraft on 2026-11-04, and the rollout is at the end of this file.

## The setup
- **Spotcraft:**
  - Sokobanko's origins are trusted: `https://sokobanko.vin.ski` and `http://localhost:3000` are in `AUTH_TRUSTED_ORIGINS`, in `/srv/spotcraft/.env` on its server. After changing it, run `docker compose up -d api`, then check that `curl -s https://api.vin.ski/v1/auth/get-session` still prints `null`. If it says "No route", the restart picked up an older image: run `docker compose pull api` and start it again.
  - **The `sokobanko` project is `private`:** only its key, an editor or the admin secret can read it, so players' results aren't public. The key is made, listed and revoked with Spotcraft's CLI, from `../spotcraft` (`keys create|list|revoke`, `access sokobanko private|open`), using the admin secret, which Sokobanko itself never holds. See `SPOTCRAFT_KEY_INTEGRATION.md`.
  - The levels and `progress/_schema.yaml` are imported with `pnpm levels:import` (with `SPOTCRAFT_KEY`), which never touches `progress/<id>.md`. Players' files are written only by the server. `pnpm progress:export` copies them into `content/progress` as a backup.
- **The Vercel project** (`vindotski/sokoban`):
  - Root Directory `apps/web`, with "Include files outside the root directory" on, since the app builds `packages/core` and `packages/game`;
  - Framework Preset Nuxt;
  - Node.js 26.x;
  - Production branch `main`;
  - the domain `sokobanko.vin.ski`: a `CNAME` to Vercel, DNS only on Cloudflare.
- **Environment variables,** in Vercel:

  | Name | Value | Environments |
  | --- | --- | --- |
  | `ENABLE_EXPERIMENTAL_COREPACK` | `1`. Without it, Vercel picks pnpm 9 or 10 from the lockfile, not the `pnpm@12.4.1` in `package.json`, and pnpm 10 doesn't read `allowBuilds`. | All |
  | `NUXT_SPOTCRAFT_KEY` | Sokobanko's own key (`sc_…`, Spotcraft's decision 50), marked **Sensitive**. It reaches only the `sokobanko` project, with `files:read`, `files:write` and `files:publish`, for reading the levels and players' files, which are private, and saving results on `main`. It lives only here, in `apps/web/.env` locally, and in your password manager. | Production (and Preview, if previews should save results) |
  | `NUXT_SPOTCRAFT_URL`, `NUXT_PUBLIC_SPOTCRAFT_URL` | Optional; `https://api.vin.ski` by default | — |

## Results on Spotcraft: the rollout (2026-11-04)
In this order, so the live site keeps working until the new version is deployed:
- [x] **1. Add the admin secret in Vercel** (Production, Sensitive). It was replaced by the key the same day (below).
- [x] **2. Deploy:** merge `dev` into `main` and push. The build log should show pnpm 12 and Node 26, and no Supabase.
- [x] **3. The smoke test,** in a fresh private window on https://sokobanko.vin.ski:
  - The first visit sets the `sokobanko-token` cookie, and the profile says "Guest".
  - `/play/two-boxes` shows the lock screen.
  - Solving First Push (→ five times) shows "Your best: 5 moves". After a reload, `/levels` shows it as solved, and `/play` opens Big Room.
  - In Spotcraft's dashboard, the `sokobanko` project has a new `progress/<id>.md`, and **Users** counts the guest.
  - The browser console shows no errors.
- [ ] **4. Remove the Supabase variables from Vercel:** `NUXT_SUPABASE_URL`, `NUXT_SUPABASE_SECRET_KEY`, and `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` if they're still there.
- [ ] **5. The Supabase project** (`xqnxptzlzsiwdqxyehvt`): nothing uses it any more. Pause or delete it, whichever you prefer. Its old completions belong to Supabase guests no one can sign in as again.

## Sokobanko's key, and a private project (2026-11-04)
Following `SPOTCRAFT_KEY_INTEGRATION.md`:
- [x] **1. Keys are live** on api.vin.ski: a bad `x-spotcraft-key` gets `401`.
- [x] **2. The key is made** (`keys create sokobanko --projects sokobanko --scopes files:read,files:write,files:publish`), and kept in the password manager.
- [x] **3. Deployed with `NUXT_SPOTCRAFT_KEY`** in Vercel. The newest result's commit is authored by `sokobanko`, the key's name.
- [x] **4. The project is private** (`access sokobanko private`). Without a key, `levels/` and `progress/` answer `401`, and the game still loads levels and saves results.
- [x] **5. The admin secret is gone** from Vercel, the code and `apps/web/.env`.

**Rotating the key:** `keys create` a new one, switch `NUXT_SPOTCRAFT_KEY` in Vercel, deploy, then `keys revoke <old id>`. **If it leaks:** `keys revoke <id>` at once. Results stop saving and levels stop loading until a new key is deployed.

## Notes
- **Caching:** each Vercel function instance caches the levels in memory for a minute (`apps/web/server/utils/levels.ts`), so instances can briefly disagree after a publish. Results aren't cached.
- **Every new best is a commit** on the `sokobanko` project's `main`, and an unimproved run makes none. When two saves race, the later one finds `main` moved and retries, up to 5 times.
- **Results are private,** since the project is: only the key can read them. They hold best moves and pushes, never solutions.
- **Previews** need their origin in Spotcraft's `AUTH_TRUSTED_ORIGINS` before guests can sign in, and they save into the same project, unless they're given another `NUXT_SPOTCRAFT_URL`.
- **Rolling back:** promote an earlier deployment in Vercel.
- **Node versions:** Nitro builds Vercel's functions for Node 24 (`nodejs24.x`), while the build runs on Node 26. The output is plain JavaScript, so that's fine.
