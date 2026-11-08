import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { LevelParseError } from "@sokoban/core";
import { notInArray, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { levels } from "../db/schema";
import { type Level, levelFromMarkdown } from "../levels/content";

let ready: Promise<void> | undefined;

/**
 * Resolves once the database is migrated and the levels are synced; every
 * query waits for it. Started at boot (server/plugins/database.ts); a failure
 * is retried by the next caller.
 */
export function databaseReady(): Promise<void> {
  ready ??= prepare().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

async function prepare(): Promise<void> {
  await migrateDatabase();
  await syncLevels();
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

/** The bundled content/levels/*.md; files that aren't playable are skipped. */
export async function bundledLevels(): Promise<Level[]> {
  const storage = useStorage("assets:levels");
  const found: Level[] = [];
  for (const key of await storage.getKeys()) {
    if (key.includes(":") || !key.endsWith(".md")) continue;
    const text = String(await storage.getItem(key));
    try {
      found.push(levelFromMarkdown(key.slice(0, -3), text));
    } catch (error) {
      if (!(error instanceof LevelParseError)) throw error;
      console.warn(`Skipping level: ${error.message}`);
    }
  }
  return found;
}

/**
 * Makes the `levels` table match the bundled files: inserts new ones,
 * updates changed ones and deletes the rest (their results go with them).
 */
async function syncLevels(): Promise<void> {
  const found = await bundledLevels();
  if (found.length === 0) throw new Error("No levels were bundled");
  await backend().db.transaction(async (tx) => {
    for (const level of found) {
      const row = {
        id: level.id,
        title: level.title,
        order: level.order ?? null,
        map: level.map,
      };
      await tx
        .insert(levels)
        .values(row)
        .onConflictDoUpdate({
          target: levels.id,
          set: { ...row, updatedAt: sql`now()` },
          setWhere: sql`(${levels.title}, ${levels.order}, ${levels.map}) is distinct from (excluded.title, excluded.order, excluded.map)`,
        });
    }
    await tx.delete(levels).where(
      notInArray(
        levels.id,
        found.map((level) => level.id),
      ),
    );
  });
}
