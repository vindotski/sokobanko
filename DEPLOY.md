# Deploying the demo (Vercel and Supabase Cloud)

Taking https://sokobanko.vin.ski live, for now on **Vercel** with a **Supabase Cloud** project. These steps are done by hand, once. Steps 1–10 took the demo live with Supabase's guest accounts; steps 11–15 then moved guests to Spotcraft, and Supabase now only holds completions. The levels keep coming from Spotcraft's hosted API (https://api.vin.ski), so the build doesn't need the `../spotcraft-main` worktree. Moving to the VPS comes later ([roadmap](docs/roadmap.md)).

- [x] **1. The Supabase project:** in the Supabase dashboard, create a project in an EU region. Save its database password in your password manager.
- [x] **2. The database:** apply this repository's migrations to it. From the repository's root:
  ```bash
  pnpm supabase login
  pnpm supabase link --project-ref <ref>     # the ref is in the project's URL
  pnpm supabase db push --dry-run            # lists the migrations it would apply
  pnpm supabase db push
  pnpm supabase migration list               # local and remote should match
  ```
  - `db push` doesn't run `supabase/seed.sql`, so the demo user (`admin@example.com`) stays local.
  - **Don't run `supabase config push`.** It would overwrite the project's auth settings with the local `config.toml`, whose Site URL is `http://127.0.0.1:3000`.
- [x] **3. Auth**, in the dashboard:
  - Turn on **Allow anonymous sign-ins** (Authentication → Sign In / Providers). Every visitor gets a guest account in the background, as they do locally.
  - Set **Site URL** to `https://sokobanko.vin.ski` (Authentication → URL Configuration).
  - **CAPTCHA stays off** for the demo. Guest sign-in doesn't send a CAPTCHA token yet, so turning it on would break sign-in. Supabase's rate limit on anonymous sign-ins (per IP, per hour) covers it until then.
- [x] **4. The keys:** from Settings → API Keys, copy:
  - the project URL (`https://<ref>.supabase.co`);
  - the **publishable** key (`sb_publishable_…`);
  - the **secret** key (`sb_secret_…`). It bypasses Row Level Security, so it only ever goes into Vercel's server-side environment.
- [x] **5. The Vercel project:** import `vindotski/sokoban`, then set:
  - **Root Directory:** `apps/web`, with "Include files outside the root directory" on, since the app builds `packages/core` and `packages/game`;
  - **Framework Preset:** Nuxt;
  - **Node.js version:** 26.x (also what `engines` asks for);
  - **Production branch:** `main`.
- [x] **6. Environment variables**, in the Vercel project:

  | Name | Value | Environments |
  | --- | --- | --- |
  | `ENABLE_EXPERIMENTAL_COREPACK` | `1`. Without it, Vercel picks pnpm 9 or 10 from the lockfile, not the `pnpm@12.4.1` in `package.json`, and pnpm 10 doesn't read `allowBuilds` in `pnpm-workspace.yaml`. | All |
  | `NUXT_PUBLIC_SUPABASE_URL` | The project URL | All |
  | `NUXT_PUBLIC_SUPABASE_KEY` | The publishable key | All |
  | `NUXT_SUPABASE_SECRET_KEY` | The secret key, marked **Sensitive** | Production (and Preview, if previews should save results) |
  | `NUXT_SPOTCRAFT_URL` | Optional; `https://api.vin.ski` by default | — |

  The Supabase module reads these variables when the app is built too, so they must be set before the first deploy.
- [x] **7. The domain:** add `sokobanko.vin.ski` in the Vercel project (Settings → Domains), and create the DNS record it shows, a `CNAME` to Vercel, wherever vin.ski's DNS is managed. On Cloudflare, set it to **DNS only**, so that Vercel issues the certificate.
- [x] **8. The first deploy:** push `main`, or press Redeploy in Vercel. The build log should show pnpm 12 and Node 26.
- [x] **9. The smoke test,** on https://sokobanko.vin.ski in a fresh private window:
  - The home page and `/levels` load. First Push is up next, and the other levels are locked.
  - `/play/two-boxes` shows the lock screen.
  - Solving First Push (→ → →) opens the dialog with "Your best: 3 moves". After a reload, `/levels` shows it as solved, and Big Room as up next.
  - The profile lists First Push, and `/play` opens Big Room.
  - In Supabase's table editor, `level_completions` has a row with `level_id = first-push`.
  - The browser console shows no errors.
- [x] **10. Spotcraft's check** (its roadmap, stage 2, step 13):
  1. In Spotcraft's dashboard, edit a level of the `sokobanko` project on a draft, publish it, and see the change on the live site within about a minute.
  2. Run `pnpm levels:export` and commit, since git is the levels' source.

When steps 9 and 10 pass, the demo is done (tagged `demo`). The proof of concept moves it to the Hetzner VPS ([roadmap](docs/roadmap.md)).

## Guests on Spotcraft (2026-11-04)
Spotcraft's API now has accounts and guests (its decisions 45 and 47; this repo's `SPOTCRAFT_AUTH_INTEGRATION.md`). Every visitor signs in as a Spotcraft guest, the token is kept in the `sokobanko-token` cookie, and Sokobanko's server checks it with Spotcraft before reading or writing completions. Supabase Auth and the Nuxt module are gone. In this order, so the live site keeps working until the new version is deployed:

- [x] **11. Trust Sokobanko's origins in Spotcraft,** on its server, as `deploy` in `/srv/spotcraft`: add `https://sokobanko.vin.ski` and `http://localhost:3000` to `AUTH_TRUSTED_ORIGINS` in `.env`, then `docker compose up -d api`. Check that `curl -s https://api.vin.ski/v1/auth/get-session` still prints `null`. If it says "No route", the restart picked up an older image: `docker compose pull api` and start it again.
- [ ] **12. Add the new variable in Vercel,** without removing anything yet: `NUXT_SUPABASE_URL` = the project URL (Production, and Preview if previews save results). Optionally, `NUXT_PUBLIC_SPOTCRAFT_URL`, which defaults to `https://api.vin.ski`.
- [ ] **13. Migrate the database,** right before deploying, since the live version can't save once it runs:
  ```bash
  pnpm supabase db push --linked --dry-run   # lists 20261104090000_completions_for_spotcraft_users.sql
  pnpm supabase db push --linked
  pnpm supabase config diff                  # enable_anonymous_sign_ins: true → false
  pnpm supabase config push
  ```
  The migration **truncates `level_completions`**, since the rows belong to Supabase guests no one can sign in as again, and drops `profiles`.
- [ ] **14. Deploy:** merge `dev` into `main` and push. Once it's live, remove `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` from Vercel, since the browser no longer talks to Supabase.
- [ ] **15. The smoke test,** in a fresh private window on https://sokobanko.vin.ski:
  - The first visit sets the `sokobanko-token` cookie, and the profile says "Guest".
  - `/play/two-boxes` shows the lock screen.
  - Solving First Push shows "Your best: 3 moves". After a reload, `/levels` shows it as solved, and `/play` opens Big Room.
  - In Supabase, the new `level_completions` row's `user_id` is a Spotcraft id, not a uuid.
  - In Spotcraft's dashboard, **Users** counts the guest.
  - The console shows no errors.


## Notes
- **Caching:** each Vercel function instance caches the levels in memory for a minute (`apps/web/server/utils/levels.ts`), so instances can briefly disagree after a publish.
- **Previews share the Supabase project** with production, unless you give them their own variables. They also need their origin in Spotcraft's `AUTH_TRUSTED_ORIGINS` before guests can sign in there.
- **Rolling back:** promote an earlier deployment in Vercel. Database migrations don't roll back with it.
- **Node versions:** Nitro builds Vercel's functions for Node 24 (`nodejs24.x`), while the build runs on Node 26. The output is plain JavaScript, so that's fine.
