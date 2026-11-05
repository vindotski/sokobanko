// A player's best results, as Spotcraft keeps them: one record per level in
// the sokobanko project's `progress` collection (Spotcraft's decision 62),
// owned by the player. Only the best moves and pushes, never solutions.

/** One level's best result. */
export interface Completion {
  level: string;
  moves: number;
  pushes: number;
  /** ISO 8601. */
  completedAt: string;
}

const LEVEL_ID = /^[a-z0-9][a-z0-9-]{0,99}$/;

const isCount = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1;

/** The completions in `{ completions: [...] }`. Malformed entries are dropped. */
export function completionsFrom(data: unknown): Completion[] {
  const list = (data as { completions?: unknown } | null)?.completions;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    const { level, moves, pushes, completedAt } = (entry ?? {}) as Record<
      string,
      unknown
    >;
    if (typeof level !== "string" || !LEVEL_ID.test(level)) return [];
    if (!isCount(moves) || !isCount(pushes)) return [];
    if (
      typeof completedAt !== "string" ||
      Number.isNaN(Date.parse(completedAt))
    )
      return [];
    return [{ level, moves, pushes, completedAt }];
  });
}
