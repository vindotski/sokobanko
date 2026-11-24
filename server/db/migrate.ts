import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";
import { SCHEMA } from "./schema.ts";

const { escapeIdentifier: id } = pg;

/** Any constant works; it only has to be the same for every run migrating Sokoban. */
const LOCK = 7_605_217_310;

/**
 * Applies the migrations in `folder` (server/db/migrations: drizzle-kit's SQL
 * files and meta/_journal.json) to the database at `url`, in one transaction
 * under an advisory lock, and records them in the app's own schema.
 *
 * Drizzle's own migrator does the same, in the same table, but first runs
 * `CREATE SCHEMA IF NOT EXISTS`, which Postgres refuses to a role that may not
 * create schemas, even when the schema exists. On Spotcraft the app's role
 * owns its schema and can't create others.
 */
export async function migrateDatabase(url: string, folder: string) {
  const migrations = readMigrationFiles({ migrationsFolder: folder });
  const table = `${id(SCHEMA)}.${id("__drizzle_migrations")}`;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [LOCK]);
    await client.query(`CREATE TABLE IF NOT EXISTS ${table} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`);
    const { rows } = await client.query<{ created_at: string }>(
      `SELECT created_at FROM ${table} ORDER BY created_at DESC LIMIT 1`,
    );
    const last = rows[0] ? Number(rows[0].created_at) : undefined;
    let applied = 0;
    for (const migration of migrations) {
      if (last !== undefined && last >= migration.folderMillis) continue;
      for (const statement of migration.sql) await client.query(statement);
      await client.query(
        `INSERT INTO ${table} (hash, created_at) VALUES ($1, $2)`,
        [migration.hash, migration.folderMillis],
      );
      applied++;
    }
    await client.query("COMMIT");
    return { applied };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
