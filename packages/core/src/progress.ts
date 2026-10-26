/**
 * - `solved`: the player has completed it; always playable.
 * - `current`: the first unsolved level in play order; playable.
 * - `locked`: any later unsolved level.
 */
export type LevelState = "solved" | "current" | "locked";

/**
 * The state of each level, given level ids in play order. Solved levels stay
 * playable even when an unsolved one comes before them, e.g. a level added
 * later in the middle; that one becomes current.
 */
export function levelStates(
  ids: readonly string[],
  isSolved: (id: string) => boolean,
): Map<string, LevelState> {
  const states = new Map<string, LevelState>();
  let current: string | undefined;
  for (const id of ids) {
    if (isSolved(id)) {
      states.set(id, "solved");
    } else if (current === undefined) {
      current = id;
      states.set(id, "current");
    } else {
      states.set(id, "locked");
    }
  }
  return states;
}
