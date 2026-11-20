import {
  levelStates,
  parseLevel,
  ReplayError,
  replayLog,
  UNDO_BUDGET,
} from "@sokobanko/core";

// An input log: LURD moves and z for undos. A generous upper bound; real
// runs are hundreds of moves at most.
const LOG = /^[lurdLURDz]{1,20000}$/;

/**
 * Verifies a run by replaying its input log, undo budget included, then
 * records its final path as the player's completion. The player is the session's guest, which the browser makes in
 * the user pool before its first save (pages/play/[id].vue); clients cannot
 * write completions themselves.
 */
export default defineEventHandler(async (event) => {
  const guest = event.context.guest;
  if (!guest) throw createError({ statusCode: 401, message: "No session" });
  const database = db();

  // `solution` is the field's name before logs: a plain solution, which is a
  // log without undos, from runs solved before the change and not yet synced.
  const body = await readBody<{ log?: unknown; solution?: unknown }>(event);
  const log = body?.log ?? body?.solution;
  if (typeof log !== "string" || !LOG.test(log)) {
    throw createError({ statusCode: 400, message: "Invalid log" });
  }

  const id = getRouterParam(event, "id") ?? "";
  const levels = await getLevels();
  const level = levels.find((l) => l.id === id);
  if (!level) {
    throw createError({ statusCode: 404, message: "Level not found" });
  }

  // Each collection unlocks in its own order: only solved levels and the
  // first unsolved one of the level's collection can be completed.
  const solved = new Set(
    (await readProgress(database, guest.id)).map((c) => c.level),
  );
  const states = levelStates(levels, (levelId) => solved.has(levelId));
  if (states.get(level.id) === "locked") {
    throw createError({ statusCode: 403, message: "Level is locked" });
  }

  let result: ReturnType<typeof replayLog>;
  try {
    result = replayLog(parseLevel(level), log, { undoBudget: UNDO_BUDGET });
  } catch (e) {
    if (e instanceof ReplayError) {
      throw createError({ statusCode: 422, message: e.message });
    }
    throw e;
  }
  if (!result.solved) {
    throw createError({ statusCode: 422, message: "Level is not solved" });
  }

  // Kept as the player's result, if it's a new best.
  const best = await recordBest(database, guest.id, {
    level: level.id,
    moves: result.moves,
    pushes: result.pushes,
    completedAt: new Date().toISOString(),
  });

  return {
    moves: result.moves,
    pushes: result.pushes,
    best: { moves: best.moves, pushes: best.pushes },
  };
});
