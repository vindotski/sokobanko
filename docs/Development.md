Start with [Getting Started](Getting-Started.md) to get the app and its local stack running.

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | Runs the app at http://localhost:3000 |
| `pnpm build` | Builds the app into `.output/` |
| `pnpm preview` | Serves the built app |
| `pnpm test` | Unit tests (Vitest); the database tests run too once the stack's settings are loaded (below) |
| `pnpm typecheck` | Type-checks the app (`nuxt typecheck`, TypeScript 6) and each package (TypeScript 7) |
| `pnpm lint` / `pnpm format` | Biome: checks, or fixes and formats |
| `pnpm db:generate` | Writes a migration after a change to `server/db/schema.ts` |
| `pnpm db:migrate` | Applies the migrations to `DATABASE_URL` (`scripts/migrate.ts`) |

## Tests

- **Game rules** (`packages/core`) and **input and camera math** (`packages/game`) are plain unit tests.
- **Database tests** (`server/utils/*.test.ts`) run against the local stack. Without `DATABASE_URL` they're skipped. With it, Vitest migrates the database once (`server/db/migrate.setup.ts`).
  - The progress tests record bests for guests in the local user pool.
  - The levels tests replay a known solution for every level in Postgres.

Load the stack's settings, then test:

```bash
set -a; . ./.env; set +a
pnpm test
```

CI does the same, against a fresh stack.

## Changing the database

1. Edit `server/db/schema.ts`.
2. Run `pnpm db:generate` and review the SQL it writes to `server/db/migrations/`.
3. Run `pnpm db:migrate`, or `pnpm exec spotcraft dev`, which migrates too.

**Migrations only ever add.** During a release the old and new versions both run for a few seconds, and a rollback runs an older image against a newer database. Renaming or dropping something needs its own plan ([Deploying on Spotcraft](Deploying-on-Spotcraft.md)). Don't edit a migration once it's been applied.

## Adding a level collection

Levels live only in Postgres, so a collection is a migration.

1. Make an empty custom migration:

   ```bash
   pnpm exec drizzle-kit generate --custom --name <collection>
   ```

2. Fill it from a plain-text XSB file. The script parses every level with the game's own parser first:

   ```bash
   node scripts/import-collection.ts <collection>.txt server/db/migrations/<file>.sql \
     --id <slug> --title "<Title>" --order <n> --author "<Author>" --credit "<Credit>"
   ```

3. Migrate, then add a solution for each new level to `server/utils/solutions.json`, with the dev server running:

   ```bash
   curl -s localhost:3000/api/levels | node scripts/solve-levels.ts server/utils/solutions.json
   ```

4. Run the database tests: every level must replay its solution.

Only add levels whose terms allow it, and keep their credit (the README lists the current ones).

## Code style

- **Biome** formats and lints everything except Markdown, the lockfile and the generated shadcn-vue components (`app/components/ui`).
- **TypeScript is strict,** including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **UI components** come from shadcn-vue (`components.json`) and are styled with the tokens in `app/assets/css/main.css`.

## Agent skills

The coding agents' skills (Nuxt, Vue, PixiJS, shadcn-vue and others) aren't committed. `skills-lock.json` lists them, and this restores them into `.agents/skills`:

```bash
npx skills experimental_install
```
