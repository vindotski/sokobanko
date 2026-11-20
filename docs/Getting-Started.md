## You need

- **Node 26** (the version is in `.nvmrc`)
- **pnpm 12** (`corepack enable` picks up the version in `package.json`)
- **Docker,** for Spotcraft's local stack: Postgres, the user pool and Mailpit

## Run it

```bash
pnpm install
pnpm exec spotcraft dev
pnpm dev
```

- **`pnpm install`** also runs `nuxt prepare`.
- **`pnpm exec spotcraft dev`** (from `@kodentuzo/spotcraft`) starts a stack for this checkout that's set up like a Spotcraft server: Postgres with the `app_sokobanko` schema, the user pool, and Mailpit. It writes the settings to `.env` at the repository root, then runs `pnpm db:migrate` (from `spotcraft.json`), which applies the migrations and with them the levels.
- **`pnpm dev`** serves the app at http://localhost:3000.

Solve the first level, and the browser makes you a guest in the local user pool. Your best then shows on the Levels page and the profile.

## Managing the stack

| Command | Does |
| --- | --- |
| `pnpm exec spotcraft dev` | Starts the stack if needed, sets up the schema, adds missing settings to `.env`, and migrates |
| `pnpm exec spotcraft dev status` | Whether the stack runs, its addresses, and the schema |
| `pnpm exec spotcraft dev db reset` | Empties the schema and migrates again |
| `pnpm exec spotcraft dev stop` | Stops the stack; its data stays |
| `pnpm exec spotcraft dev ls` | Every stack on this machine |

Each checkout (or git worktree) gets its own stack on free ports, so several can run side by side.

## Trying it on a phone

The local user pool listens on `127.0.0.1` only. The dev server passes `/_spotcraft/auth` on to it (`nitro.devProxy` in `nuxt.config.ts`), as Spotcraft's proxy does in production. Phones on the same Wi-Fi can play and save:

```bash
pnpm dev --host 0.0.0.0
```

Then open `http://<your computer's LAN address>:3000` on the phone.

## Next

- [Development](Development.md): scripts, tests, migrations and adding levels
- [Architecture](Architecture.md): how the pieces fit
