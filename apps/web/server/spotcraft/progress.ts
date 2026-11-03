// A player's results as Spotcraft content: `progress/<spotcraft-id>.md` in
// the sokobanko project, typed by content/progress/_schema.yaml. Only the best
// moves and pushes per level, never solutions: published content is public.

/** One level's best result. */
export interface Completion {
  level: string;
  moves: number;
  pushes: number;
  /** ISO 8601. */
  completedAt: string;
}

const PLAYER_ID = /^[A-Za-z0-9_-]{1,64}$/;
const LEVEL_ID = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** The player's file in the project, or a throw for an id that isn't Spotcraft's. */
export function playerPath(id: string): string {
  if (!PLAYER_ID.test(id)) throw new Error(`Not a Spotcraft user id: ${id}`);
  return `progress/${id}.md`;
}

const isCount = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1;

/** The completions in a file's front matter. Malformed entries are dropped. */
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

/**
 * Adds a run, keeping the existing result unless the run has fewer moves (the
 * rule the database used to apply). `improved` says whether anything changed,
 * so an unimproved run needn't be saved.
 */
export function withBest(
  completions: readonly Completion[],
  run: Completion,
): { completions: Completion[]; best: Completion; improved: boolean } {
  const current = completions.find((c) => c.level === run.level);
  if (current && current.moves <= run.moves) {
    return { completions: [...completions], best: current, improved: false };
  }
  return {
    completions: [...completions.filter((c) => c.level !== run.level), run],
    best: run,
    improved: true,
  };
}

/** The player's file: front matter only, levels in alphabetical order. */
export function toMarkdown(completions: readonly Completion[]): string {
  const sorted = [...completions].sort((a, b) =>
    a.level.localeCompare(b.level),
  );
  const lines = sorted.flatMap((c) => [
    `  - level: ${c.level}`,
    `    moves: ${c.moves}`,
    `    pushes: ${c.pushes}`,
    `    completedAt: "${c.completedAt}"`,
  ]);
  const body = lines.length
    ? `completions:\n${lines.join("\n")}`
    : "completions: []";
  return `---\n${body}\n---\n`;
}
