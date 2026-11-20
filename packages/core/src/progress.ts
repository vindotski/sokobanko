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

/** A run's score: fewer moves is better, then fewer pushes. */
export interface Score {
  moves: number;
  pushes: number;
}

/** Whether `a` beats `b`: fewer moves, or as many in fewer pushes. A tie isn't better. */
export function isBetter(a: Score, b: Score | undefined): boolean {
  if (!b) return true;
  return a.moves < b.moves || (a.moves === b.moves && a.pushes < b.pushes);
}

/**
 * The ids of levels solved here that the server doesn't know about yet, or
 * knows a worse result for, in play order, so the server's own unlocking
 * accepts each one in turn.
 */
export function pendingUploads(
  levels: readonly LevelRef[],
  local: Readonly<Record<string, Score>>,
  server: Readonly<Record<string, Score>>,
): string[] {
  return levels
    .filter(({ id }) => {
      const mine = local[id];
      return !!mine && isBetter(mine, server[id]);
    })
    .map(({ id }) => id);
}
