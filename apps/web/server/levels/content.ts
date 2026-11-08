import { type LevelJson, LevelParseError, parseLevel } from "@sokoban/core";
import { parse } from "yaml";

/** A level as the API returns it. */
export interface Level extends LevelJson {
  /** Play order; levels without one come last. */
  order?: number;
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * A level from `content/levels/<slug>.md`: YAML front matter with `title`,
 * `map` (rows of `#@+$*. `) and an optional integer `order`. The body is free
 * prose (credits) and is ignored. Throws `LevelParseError` when the file isn't
 * a playable level.
 */
export function levelFromMarkdown(slug: string, text: string): Level {
  if (!SLUG.test(slug))
    throw new LevelParseError(slug, "the file name must be a lowercase slug");
  const match = FRONT_MATTER.exec(text);
  if (!match) throw new LevelParseError(slug, "no front matter");
  const data: unknown = parse(match[1] ?? "");
  if (typeof data !== "object" || data === null) {
    throw new LevelParseError(slug, "the front matter isn't a mapping");
  }
  const { title, map, order } = data as Record<string, unknown>;
  if (typeof title !== "string" || title.length < 1 || title.length > 80) {
    throw new LevelParseError(slug, "title must be 1–80 characters");
  }
  if (
    !Array.isArray(map) ||
    map.length > 50 ||
    !map.every((row) => typeof row === "string" && row.length <= 50)
  ) {
    throw new LevelParseError(slug, "map must be at most 50 rows of 50");
  }
  if (order !== undefined && !Number.isInteger(order)) {
    throw new LevelParseError(slug, "order must be an integer");
  }
  const level: Level = { id: slug, title, map };
  if (typeof order === "number") level.order = order;
  parseLevel(level);
  return level;
}

/** Levels in play order: by `order`, then by id. */
export function sortLevels<T extends Level>(levels: T[]): T[] {
  return levels.sort(
    (a, b) =>
      (a.order ?? Number.POSITIVE_INFINITY) -
        (b.order ?? Number.POSITIVE_INFINITY) || a.id.localeCompare(b.id),
  );
}
