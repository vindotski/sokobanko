import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { migrateApp, migrationsFromFiles } from "@spotcraft/kit/migrate";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

/**
 * Vitest's global setup: with DATABASE_URL set, applies the migrations once
 * before any database test runs, the way the server does at start
 * (server/utils/database.ts). Each test file migrating on its own would race.
 */
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const folder = new URL("./migrations/", import.meta.url);
  const names = (await readdir(folder)).filter((name) => name.endsWith(".sql"));
  const files = await Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(fileURLToPath(new URL(name, folder)), "utf8"),
    })),
  );
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    await migrateApp(drizzle(pool), migrationsFromFiles(files), {
      adoptDrizzle: true,
    });
  } finally {
    await pool.end();
  }
}
