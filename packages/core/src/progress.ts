/**
 * - `solved`: the player has completed it; always playable.
 * - `current`: the first unsolved level of its collection; playable.
 * - `locked`: any later unsolved level in the same collection.
 */
export type LevelState = "solved" | "current" | "locked";

/** A level's id and the collection it belongs to. */
export interface LevelRef {
  id: string;
  collection: string;
}

/**
 * The state of each level, given levels in play order. Each collection unlocks
 * on its own: one never locks another. Solved levels stay playable even when
 * an unsolved one comes before them, e.g. a level added later in the middle;
 * that one becomes its collection's current level.
 */
export function levelStates(
  levels: readonly LevelRef[],
  isSolved: (id: string) => boolean,
): Map<string, LevelState> {
  const states = new Map<string, LevelState>();
  const withCurrent = new Set<string>();
  for (const { id, collection } of levels) {
    if (isSolved(id)) {
      states.set(id, "solved");
    } else if (!withCurrent.has(collection)) {
      withCurrent.add(collection);
      states.set(id, "current");
    } else {
      states.set(id, "locked");
    }
  }
  return states;
}
