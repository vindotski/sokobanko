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
  - The levels and `progress/_schema.yaml` are imported with `pnpm levels:import`, which never touches `progress/<id>.md`. Players' files are written only by the server. `pnpm progress:export` copies them into `content/progress` as a backup.
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
  | `NUXT_SPOTCRAFT_ADMIN_SECRET` | Spotcraft's `ADMIN_SECRET`, marked **Sensitive**. The server needs it to save results, since players can't write content. It can edit every project on api.vin.ski, so it only ever lives here, in `apps/web/.env` locally, and in your password manager. | Production (and Preview, if previews should save results) |
  | `NUXT_SPOTCRAFT_URL`, `NUXT_PUBLIC_SPOTCRAFT_URL` | Optional; `https://api.vin.ski` by default | — |

## Results on Spotcraft: the rollout (2026-11-04)
In this order, so the live site keeps working until the new version is deployed:
- [ ] **1. Add `NUXT_SPOTCRAFT_ADMIN_SECRET` in Vercel** (Production, Sensitive). Adding it doesn't redeploy anything.
- [ ] **2. Deploy:** merge `dev` into `main` and push. The build log should show pnpm 12 and Node 26, and no Supabase.
- [ ] **3. The smoke test,** in a fresh private window on https://sokobanko.vin.ski:
  - The first visit sets the `sokobanko-token` cookie, and the profile says "Guest".
  - `/play/two-boxes` shows the lock screen.
  - Solving First Push (→ five times) shows "Your best: 5 moves". After a reload, `/levels` shows it as solved, and `/play` opens Big Room.
  - In Spotcraft's dashboard, the `sokobanko` project has a new `progress/<id>.md`, and **Users** counts the guest.
  - The browser console shows no errors.
- [ ] **4. Remove the Supabase variables from Vercel:** `NUXT_SUPABASE_URL`, `NUXT_SUPABASE_SECRET_KEY`, and `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` if they're still there.
- [ ] **5. The Supabase project** (`xqnxptzlzsiwdqxyehvt`): nothing uses it any more. Pause or delete it, whichever you prefer. Its old completions belong to Supabase guests no one can sign in as again.

## Notes
- **Caching:** each Vercel function instance caches the levels in memory for a minute (`apps/web/server/utils/levels.ts`), so instances can briefly disagree after a publish. Results aren't cached.
- **Every new best is a commit** on the `sokobanko` project's `main`, and an unimproved run makes none. When two saves race, the later one finds `main` moved and retries, up to 5 times.
- **Results are public,** like all published content, but they only hold best moves and pushes, never solutions.
- **Previews** need their origin in Spotcraft's `AUTH_TRUSTED_ORIGINS` before guests can sign in, and they save into the same project, unless they're given another `NUXT_SPOTCRAFT_URL`.
- **Rolling back:** promote an earlier deployment in Vercel.
- **Node versions:** Nitro builds Vercel's functions for Node 24 (`nodejs24.x`), while the build runs on Node 26. The output is plain JavaScript, so that's fine.
