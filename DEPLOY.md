# Deploying the demo (Vercel and Spotcraft)

https://sokobanko.vin.ski runs on **Vercel** for now. Everything it stores is on Spotcraft's hosted API (https://api.vin.ski), in the `sokobanko` project:
- **the levels:** `levels/*.md`, imported from this repository;
- **the guests:** Spotcraft accounts (Spotcraft's decisions 45 and 47);
- **each player's best results:** app data records (collection `progress`, one per player and level), written by Sokobanko's server.

There's no database of its own. Moving to the VPS that runs api.vin.ski is the proof of concept ([roadmap](docs/roadmap.md)).

The demo first ran with Supabase for guests and results (tagged `demo`). Both moved to Spotcraft on 2026-11-04, and the rollout is at the end of this file.

## The setup
- **Spotcraft:**
  - Sokobanko's origins are trusted: `https://sokobanko.vin.ski` and `http://localhost:3000` are in `AUTH_TRUSTED_ORIGINS`, in `/srv/spotcraft/.env` on its server. After changing it, run `docker compose up -d api`, then check that `curl -s https://api.vin.ski/v1/auth/get-session` still prints `null`. If it says "No route", the restart picked up an older image: run `docker compose pull api` and start it again.
  - **The `sokobanko` project is `private`:** only its key, an editor or the admin secret can read its levels. Players' records are reached only with the key plus that player's session token. The key is made, listed and revoked with Spotcraft's CLI, from `../spotcraft` (`keys create|list|revoke`, `access sokobanko private|open`), using the admin secret, which Sokobanko itself never holds. See `SPOTCRAFT_KEY_INTEGRATION.md`.
  - The levels are published with `pnpm levels:import` (with `SPOTCRAFT_KEY`), as the project's next version. Players' records are written only by the server, and Spotcraft's nightly backups hold them.
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
  | `NUXT_SPOTCRAFT_KEY` | Sokobanko's own key (`sc_…`, Spotcraft's decision 50), marked **Sensitive**. It reaches only the `sokobanko` project, with `files:read` and `files:publish` (the levels) and `data:read` and `data:write` (players' records). It lives only here, in `apps/web/.env` locally, and in your password manager. | Production (and Preview, if previews should save results) |
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

## App data (Spotcraft's reset)
Following `SPOTCRAFT_APP_DATA_INTEGRATION.md`. The code is ready on `dev`. In this order, right after Spotcraft's reset ([its DEPLOY.md](../spotcraft/DEPLOY.md), "Content as versions, and app data: the reset"); from its step 7 until this is deployed, completing a level fails and results don't show:
- [ ] **1. Spotcraft's reset, up to its step 11:** existing results are converted into records.
- [ ] **2. The new key**, from `../spotcraft` with `SPOTCRAFT_API_URL=https://api.vin.ski` and the admin secret: `keys create sokobanko --projects sokobanko --scopes files:read,files:publish,data:read,data:write`. Keep it in the password manager. A key's scopes can't change, so it's a new one.
- [ ] **3. Switch `NUXT_SPOTCRAFT_KEY`** in Vercel (Production, Sensitive), and `SPOTCRAFT_KEY` wherever the level scripts run.
- [ ] **4. Deploy:** merge `dev` into `main` and push.
- [ ] **5. Check,** on https://sokobanko.vin.ski:
  - as a player who had results: they show, a new best is saved and an unimproved run isn't;
  - as a new guest: solving First Push shows the result, after a reload too, and `/play` opens Big Room;
  - the browser console shows no errors;
  - `pnpm levels:import` answers "levels unchanged", or "published version N".
- [ ] **6. Keep the old key until Spotcraft's reset is settled** (its step 16), since rolling back means the previous Sokobanko with the old key. Then `keys list` and `keys revoke <old id>`.

## Notes
- **Caching:** each Vercel function instance caches the levels in memory for a minute (`apps/web/server/utils/levels.ts`), so instances can briefly disagree after a publish. Results aren't cached.
- **Every new best rewrites one record,** the player's for that level, and an unimproved run writes nothing. It's a compare-and-swap on that record, retried up to 5 times if the same player saved meanwhile (another tab).
- **Results are private:** a record is reached only with the key plus its player's token. They hold best moves and pushes, never solutions.
- **Previews** need their origin in Spotcraft's `AUTH_TRUSTED_ORIGINS` before guests can sign in, and they save into the same project, unless they're given another `NUXT_SPOTCRAFT_URL`.
- **Rolling back:** promote an earlier deployment in Vercel.
- **Node versions:** Nitro builds Vercel's functions for Node 24 (`nodejs24.x`), while the build runs on Node 26. The output is plain JavaScript, so that's fine.
