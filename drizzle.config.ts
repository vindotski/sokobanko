import { defineConfig } from "drizzle-kit";

// `pnpm db:generate` writes a new SQL migration after a schema change.
// Spotcraft runs them before a new version starts (the image's
// dev.spotcraft.migrate label); locally, `spotkit dev` runs `pnpm db:migrate`.
// The pool's `auth.users` is in server/db/auth.ts, outside `schema`, so it's
// referenced but never migrated.
export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  migrations: { schema: "app_sokoban" },
});
