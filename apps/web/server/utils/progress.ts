import { type Completion, completionsFrom } from "../spotcraft/progress";
import { rpc, SpotcraftRpcError } from "../spotcraft/rpc";

const PROJECT = "sokobanko";
/** One record per player and level, keyed by the level's id (Spotcraft's decision 62). */
const COLLECTION = "progress";

type Best = { moves: number; pushes: number; completedAt: string };
type Stored = { key: string; value: Best; version: number };

/**
 * A call for the player's own records: Sokobanko's key with the player's
 * session token, which tells Spotcraft whose records they are.
 */
function call<T>(token: string, procedure: string, input: unknown): Promise<T> {
  const { spotcraftUrl, spotcraftKey } = useRuntimeConfig();
  if (!spotcraftKey) {
    throw createError({
      statusCode: 500,
      message: "Saving results isn't configured",
    });
  }
  return rpc<T>(spotcraftUrl, { key: spotcraftKey, token }, procedure, input);
}

/** The player's best results, one record per level. None yet is an empty list. */
export async function readProgress(token: string): Promise<Completion[]> {
  const found: unknown[] = [];
  let after: string | undefined;
  do {
    const page = await call<{ records: Stored[]; next: string | null }>(
      token,
      "data.list",
      {
        project: PROJECT,
        collection: COLLECTION,
        limit: 100,
        ...(after ? { after } : {}),
      },
    );
    found.push(...page.records.map((r) => ({ level: r.key, ...r.value })));
    after = page.next ?? undefined;
  } while (after);
  // Malformed records are dropped, as malformed progress files were.
  return completionsFrom({ completions: found });
}

/**
 * Records a run, already replayed and verified, if it beats the player's best
 * for that level (fewer moves), and answers the best. A compare-and-swap on
 * that one record: if it changed meanwhile (the same player, in another tab),
 * it's read again.
 */
export async function recordBest(
  token: string,
  run: Completion,
): Promise<Completion> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    let current: Stored | null = null;
    try {
      current = await call<Stored>(token, "data.get", {
        project: PROJECT,
        collection: COLLECTION,
        key: run.level,
      });
    } catch (error) {
      if (!(error instanceof SpotcraftRpcError && error.code === "NOT_FOUND")) {
        throw error;
      }
    }
    if (current && current.value.moves <= run.moves) {
      return { level: run.level, ...current.value };
    }
    try {
      await call(token, "data.put", {
        project: PROJECT,
        collection: COLLECTION,
        key: run.level,
        value: {
          moves: run.moves,
          pushes: run.pushes,
          completedAt: run.completedAt,
        },
        // 0 only creates; n only replaces version n.
        version: current?.version ?? 0,
      });
      return run;
    } catch (error) {
      if (error instanceof SpotcraftRpcError && error.code === "CONFLICT") {
        continue;
      }
      throw error;
    }
  }
  throw createError({
    statusCode: 503,
    message: "Spotcraft is busy; try again",
  });
}
