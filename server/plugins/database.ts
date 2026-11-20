import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { migrateDatabase } from "../db/migrate";

/**
 * `node .output/server/index.mjs migrate` applies the migrations and exits:
 * the image's dev.spotcraft.migrate label, which Spotcraft runs before a new
 * version starts. They're bundled as server assets, and the migrator reads a
 * folder, so they're written to a temporary one first (/tmp is the only
 * writable place in the container). Otherwise this only closes the database
 * on shutdown.
 */
export default defineNitroPlugin(async (nitroApp) => {
  nitroApp.hooks.hook("close", closeDb);
  if (import.meta.prerender || process.argv[2] !== "migrate") return;
  const storage = useStorage("assets:migrations");
  const folder = await mkdtemp(join(tmpdir(), "sokobanko-migrations-"));
  try {
    for (const key of await storage.getKeys()) {
      const file = join(folder, ...key.split(":"));
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, (await storage.getItemRaw(key)) as Uint8Array);
    }
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const { applied } = await migrateDatabase(url, folder);
    console.info(`Migrated: ${applied} new`);
    process.exit(0);
  } catch (error) {
    console.error("The migrations failed:", error);
    process.exit(1);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
