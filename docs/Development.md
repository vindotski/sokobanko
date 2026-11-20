Start with [Getting Started](Getting-Started.md) to get the app and its local stack running.

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | Runs the app at http://localhost:3000 |
| `pnpm build` | Builds the app into `.output/` |
| `pnpm preview` | Serves the built app |
| `pnpm test` | Every test: the unit tests and the Storybook stories |
| `pnpm test:unit` | Unit tests (Vitest); the database tests run too once the stack's settings are loaded (below) |
| `pnpm storybook` | Storybook at http://localhost:6006 |
| `pnpm test:storybook` | Every story as a test, in light and dark ([below](#storybook)) |
| `pnpm build-storybook` | The static Storybook, in `storybook-static/` |
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
pnpm test:unit
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

## Storybook

[Storybook](https://storybook.js.org) documents the components and tests them. It runs inside the Nuxt app (`@storybook-vue/nuxt`), so auto-imports, color mode and Tailwind work in stories.

- **Where things are:** stories live in `stories/`: `ui/` for the shadcn-vue primitives, `app/` for Sokobanko's components, and `docs/` for the Introduction and the design tokens (colours, type, sizing, the board's pieces). Level fixtures are in `stories/fixtures/levels.ts`. Stories stay out of `app/components`, because Nuxt would register them as components there.
- **Toolbars:** **Theme** switches light and dark (the `dark` class on `<html>`, as color mode sets it), and **Viewport** switches phone and desktop.
- **Leaving out:** components that read the TanStack collections or the server (the pages, `PlayButton`) aren't storied.

### Every story is a test

`pnpm test:storybook` runs each story in headless Chromium twice, in light and in dark: the Vitest projects `storybook-light` and `storybook-dark`, in `vitest.config.ts`. A story fails if:

- it doesn't render;
- its `play` function fails: the clicks, keys and emitted events it checks;
- axe finds a violation. Every story runs with `a11y: { test: "error" }`. To turn off one rule for one story, explain why in a comment, as the open dropdown menus do;
- its screenshot differs from its baseline in `__screenshots__/`, next to the story file.

### Screenshots

- **Linux only:** baselines are rendered on CI's Linux Chromium, and only compared there; fonts render differently on a Mac. A local run checks everything else. `VISUAL=1` forces the comparison anywhere.
- **What's captured:** the whole page, in each theme, so dialogs and menus portalled to `<body>` are included. On the test page, animations finish at once (`.storybook/vitest.html`).
- **Opting out:** a story opts out with `parameters: { visual: false }`. The PixiJS board does, because screenshots don't capture its WebGL canvas.

After an intended visual change, CI's `storybook` job fails, and its `screenshot-diffs` artifact holds the actual and diff images. To take new baselines:

```bash
gh workflow run update-screenshots.yml --ref <branch>
gh run download <run id> -n screenshots -D stories
```

Review the images, then commit them (signed) with the change. A new story's first CI run also writes its baseline into `screenshot-diffs`.

## Code style

- **Biome** formats and lints everything except Markdown, the lockfile and the generated shadcn-vue components (`app/components/ui`).
- **TypeScript is strict,** including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- **UI components** come from shadcn-vue (`components.json`) and are styled with the tokens in `app/assets/css/main.css`.

## Agent skills

The coding agents' skills (Nuxt, Vue, PixiJS, shadcn-vue and others) aren't committed. `skills-lock.json` lists them, and this restores them into `.agents/skills`:

```bash
npx skills experimental_install
```
