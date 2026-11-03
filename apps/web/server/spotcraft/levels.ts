import { type LevelJson, LevelParseError, parseLevel } from "@sokoban/core";

/** One document in a Spotcraft folder listing (`GET …/content/levels/`). */
export interface ContentItem {
  /** The file's path without `.md`, such as `levels/first-push`. */
  path: string;
  /** Its front matter. */
  data: Record<string, unknown>;
  updatedAt: string;
}

/** A published level, as the API returns it. */
export interface Level extends LevelJson {
  /** Play order; levels without one come last. */
  order?: number;
}

/**
 * Levels from the `sokobanko` project's `levels/` folder, in play order: by
 * `order`, then by id. The id is the slug, the last segment of the path.
 * Spotcraft's `_schema.yaml` checks the shape; a map `parseLevel` rejects (one
 * player, as many goals as boxes: rules the schema can't express) is logged
 * and skipped.
 */
export function levelsFromItems(items: readonly ContentItem[]): Level[] {
  const levels: Level[] = [];
  for (const { path, data } of items) {
    const level: Level = {
      id: path.slice(path.lastIndexOf("/") + 1),
      title: String(data.title),
      map: Array.isArray(data.map) ? data.map.map(String) : [],
    };
    if (typeof data.order === "number") level.order = data.order;
    try {
      parseLevel(level);
    } catch (error) {
      if (!(error instanceof LevelParseError)) throw error;
      console.warn(`Skipping ${path}: ${error.message}`);
      continue;
    }
    levels.push(level);
  }
  return levels.sort(
    (a, b) =>
      (a.order ?? Number.POSITIVE_INFINITY) -
        (b.order ?? Number.POSITIVE_INFINITY) || a.id.localeCompare(b.id),
  );
}
