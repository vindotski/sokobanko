import { fileURLToPath } from "node:url";
import { migrateDatabase } from "./migrate.ts";

/**
 * Vitest's global setup: with DATABASE_URL set, applies the migrations once
 * before any database test runs, as `spotcraft dev` does (`pnpm db:migrate`).
 * Each test file migrating on its own would race.
 */
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  await migrateDatabase(
    url,
    fileURLToPath(new URL("./migrations/", import.meta.url)),
  );
}
