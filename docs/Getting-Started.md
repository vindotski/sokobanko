## You need

- **Node 26** (the version is in `.nvmrc`)
- **pnpm 12** (`corepack enable` picks up the version in `package.json`)
- **Docker,** for Spotkit's local stack: Postgres, the user pool and Mailpit

## Run it

```bash
pnpm install
pnpm exec spotkit dev   # stays running; open a second terminal for the next line
pnpm dev
```

- **`pnpm install`** also runs `nuxt prepare`.
- **`pnpm exec spotkit dev`** (from `@kodentuzo/spotkit`) starts a stack for this checkout that's set up like a Spotcraft server: Postgres with the `app_sokoban` schema, the user pool, and Mailpit. It then keeps serving small stand-ins for the analytics script and the legal facts until you press Ctrl+C (the stack keeps running). It writes the settings to `.env` at the repository root, then runs `pnpm db:migrate` (from `spotkit.json`), which applies the migrations and with them the levels.
- **`pnpm dev`** serves the app at http://localhost:3000.

Click Play on a level and solve it, and the browser makes you a guest in the local user pool (nothing is stored before that first click). Your best then shows on the map and in Progress.

## Managing the stack

| Command | Does |
| --- | --- |
| `pnpm exec spotkit dev` | Starts the stack if needed, sets up the schema, adds missing settings to `.env`, and migrates |
| `pnpm exec spotkit dev status` | Whether the stack runs, its addresses, and the schema |
| `pnpm exec spotkit dev db reset` | Empties the schema and migrates again |
| `pnpm exec spotkit dev stop` | Stops the stack; its data stays |
| `pnpm exec spotkit dev ls` | Every stack on this machine |

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
