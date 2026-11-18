import { migrationsFromFiles } from "@spotcraft/kit/migrate";
import { type PrepareOptions, prepare } from "@spotcraft/kit/nuxt";

/**
 * Resolves once the database is migrated; every query waits for it. The
 * migrations also write the levels, since Postgres is their only source.
 * In production the server does it before it goes live
 * (server/plugins/database.ts); in dev the first query does. The kit runs it
 * once per backend, and a failure is retried by the next caller.
 */
export async function databaseReady(): Promise<void> {
  await prepare(backend(), await prepareOptions());
}

/**
 * The app's migrations: server/db/migrations, written by `pnpm db:generate`
 * and bundled as server assets. `adoptDrizzle` takes over the history of
 * Drizzle's own migrator, which applied them before kit 0.4.0.
 */
export async function prepareOptions(): Promise<PrepareOptions> {
  const storage = useStorage("assets:migrations");
  // Drizzle's meta/ folder (meta:…) isn't needed at run time.
  const names = (await storage.getKeys()).filter(
    (key) => !key.includes(":") && key.endsWith(".sql"),
  );
  const files = await Promise.all(
    names.map(async (name) => ({
      name,
      sql: String(await storage.getItemRaw(name)),
    })),
  );
  return { migrations: migrationsFromFiles(files), adoptDrizzle: true };
}
