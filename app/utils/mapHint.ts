import { type LevelRef, type LevelState, levelStates } from "@sokoban/core";

/**
 * The map hint: where the player is up to, in a small cookie, so the server
 * can render the map as the player last saw it instead of empty (no jump when
 * the browser's progress loads). Only a hint: the browser's own progress
 * replaces it as soon as it's read.
 *
 * Each collection's level up next, or `*` once it's all solved:
 * `basics:*|microban:microban-041`. Collections unlock in order (levelStates),
 * so that's enough for every level's state. A solved level after the one up
 * next (one added later in the middle) shows as locked until the real
 * progress arrives.
 */
export const MAP_HINT_COOKIE = "sokoban-map";
/** The map's levels per row, so it isn't drawn 4 wide and then re-flowed. */
export const MAP_COLUMNS_COOKIE = "sokoban-map-columns";
/** A year, renewed whenever the progress changes. */
export const MAP_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Each collection's level up next; `null` when all of it is solved. */
export type MapHint = Record<string, string | null>;

const ALL_SOLVED = "*";
const ID = /^[a-z0-9-]{1,64}$/;

/** The hint for these states: each collection's level up next. */
export function hintFromStates(
  levels: readonly LevelRef[],
  states:
    | ReadonlyMap<string, LevelState>
    | Readonly<Record<string, LevelState>>,
): MapHint {
  const get = (id: string) =>
    states instanceof Map
      ? states.get(id)
      : (states as Record<string, LevelState>)[id];
  const hint: MapHint = {};
  for (const { id, collection } of levels) {
    if (!(collection in hint)) hint[collection] = null;
    if (hint[collection] === null && get(id) === "current") {
      hint[collection] = id;
    }
  }
  return hint;
}

export function serializeHint(hint: MapHint): string {
  return Object.entries(hint)
    .map(([collection, next]) => `${collection}:${next ?? ALL_SOLVED}`)
    .join("|");
}

/** Reads a hint, skipping anything malformed; undefined if nothing's left. */
export function parseHint(value: unknown): MapHint | undefined {
  if (typeof value !== "string" || value.length > 1024) return undefined;
  const hint: MapHint = {};
  for (const part of value.split("|")) {
    const [collection, next, ...rest] = part.split(":");
    if (rest.length || !collection || !ID.test(collection) || !next) continue;
    if (next === ALL_SOLVED) hint[collection] = null;
    else if (ID.test(next)) hint[collection] = next;
  }
  return Object.keys(hint).length ? hint : undefined;
}

/**
 * Every level's state from a hint, given the levels in play order. A
 * collection the hint doesn't know, or whose level up next no longer exists,
 * counts as unsolved.
 */
export function statesFromHint(
  levels: readonly LevelRef[],
  hint: MapHint,
): Map<string, LevelState> {
  const valid = new Set(
    levels.filter((l) => hint[l.collection] === l.id).map((l) => l.collection),
  );
  const solved = new Set<string>();
  const reached = new Set<string>();
  for (const { id, collection } of levels) {
    if (hint[collection] === null) solved.add(id);
    else if (hint[collection] === id) reached.add(collection);
    else if (valid.has(collection) && !reached.has(collection)) solved.add(id);
  }
  return levelStates(levels, (id) => solved.has(id));
}

/** The map's levels per row from its cookie, if it's one it could have written. */
export function parseColumns(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n >= 4 && n <= 10 ? n : undefined;
}
