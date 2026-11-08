import { defineConfig } from "drizzle-kit";

// `pnpm db:generate` writes a new SQL migration after a schema change; the
// server applies them at startup (server/plugins/database.ts).
export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  // Spotcraft owns `auth`; only ever generate Sokobanko's own tables.
  schemaFilter: ["public"],
});
