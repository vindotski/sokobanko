import { levelStates, parseLevel, ReplayError, replay } from "@sokoban/core";

// Generous upper bound; real solutions are hundreds of moves at most.
const SOLUTION = /^[lurdLURD]{1,20000}$/;

/**
 * Verifies a solution by replaying it, then records it as the player's
 * completion. The player is the session's guest, which the browser makes in
 * the user pool before its first save (pages/play/[id].vue); clients cannot
 * write completions themselves.
 */
export default defineEventHandler(async (event) => {
  const guest = event.context.guest;
  if (!guest) throw createError({ statusCode: 401, message: "No session" });
  const database = db();

  const body = await readBody<{ solution?: unknown }>(event);
  const solution = body?.solution;
  if (typeof solution !== "string" || !SOLUTION.test(solution)) {
    throw createError({ statusCode: 400, message: "Invalid solution" });
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

  let result: ReturnType<typeof replay>;
  try {
    result = replay(parseLevel(level), solution);
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
