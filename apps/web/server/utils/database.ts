import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";

let ready: Promise<void> | undefined;

/**
 * Resolves once the database is migrated; every query waits for it. The
 * migrations also write the levels, since Postgres is their only source.
 * Started at boot (server/plugins/database.ts); a failure is retried by the
 * next caller.
 */
export function databaseReady(): Promise<void> {
  ready ??= migrateDatabase().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

/**
 * Applies server/db/migrations. They're bundled as server assets, and
 * Drizzle's migrator reads a folder, so they're written to a temporary one
 * first (/tmp is the only writable place on Spotcraft).
 */
async function migrateDatabase(): Promise<void> {
  const storage = useStorage("assets:migrations");
  const folder = await mkdtemp(join(tmpdir(), "sokobanko-migrations-"));
  try {
    for (const key of await storage.getKeys()) {
      const file = join(folder, ...key.split(":"));
      await mkdir(dirname(file), { recursive: true });
      const content = await storage.getItemRaw(key);
      await writeFile(file, content as Uint8Array | string);
    }
    await migrate(backend().db, { migrationsFolder: folder });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
