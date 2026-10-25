# sokobanko

A pnpm monorepo.

## Requirements

- Node.js 26+
- pnpm 12
- Docker (for the local Supabase stack)

## Getting started

```sh
pnpm install
```

## Scripts

| Command          | Description                           |
| ---------------- | ------------------------------------- |
| `pnpm build`     | Build all packages                    |
| `pnpm dev`       | Run `dev` in all packages in parallel |
| `pnpm test`      | Run tests with Vitest                 |
| `pnpm typecheck` | Type-check all packages               |
| `pnpm lint`      | Lint and check formatting with Biome  |
| `pnpm format`    | Apply Biome fixes and formatting      |

## Local Supabase

The Supabase CLI is pinned as a dev dependency; config lives in `supabase/`.

```sh
pnpm supabase start    # start the stack in Docker
pnpm supabase status   # print URLs and keys
pnpm supabase stop     # stop (keeps data; --no-backup wipes it)
```

Ports use the 546xx range so the stack can run alongside other local
Supabase projects:

| Service  | URL                                                     |
| -------- | ------------------------------------------------------- |
| API      | http://127.0.0.1:54621                                  |
| Database | postgresql://postgres:postgres@127.0.0.1:54622/postgres |
| Studio   | http://127.0.0.1:54623                                  |
| Mailpit  | http://127.0.0.1:54624                                  |

## Structure

```
apps/       # applications
packages/   # shared libraries
supabase/   # local Supabase config, migrations, seed
```
