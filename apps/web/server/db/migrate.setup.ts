import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

/**
 * Vitest's global setup: with DATABASE_URL set, applies the migrations once
 * before any database test runs. Each test file migrating on its own raced
 * on an empty database (CI's), both creating Drizzle's schema at once.
 */
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url)),
    });
  } finally {
    await pool.end();
  }
}
