import { levels } from "../db/schema";
import { type Level, sortLevels } from "../levels/content";

/** Levels in play order, from the `levels` table (synced from content/levels). */
export async function getLevels(): Promise<Level[]> {
  await databaseReady();
  const rows = await backend().db.select().from(levels);
  return sortLevels(
    rows.map(({ id, title, order, map }) =>
      order === null ? { id, title, map } : { id, title, order, map },
    ),
  );
}
