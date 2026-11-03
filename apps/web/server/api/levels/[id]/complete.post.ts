import { levelStates, parseLevel, ReplayError, replay } from "@sokoban/core";

// Generous upper bound; real solutions are hundreds of moves at most.
const SOLUTION = /^[lurdLURD]{1,20000}$/;

/**
 * Verifies a solution by replaying it, then records it as the player's
 * completion. The player is whoever Spotcraft says the session belongs to;
 * clients cannot write completions themselves.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readBody<{ solution?: unknown }>(event);
  const solution = body?.solution;
  if (typeof solution !== "string" || !SOLUTION.test(solution)) {
    throw createError({ statusCode: 400, message: "Invalid solution" });
  }

  // Levels, and their play order, come from Spotcraft.
  const id = getRouterParam(event, "id") ?? "";
  const levels = await getLevels();
  const level = levels.find((l) => l.id === id);
  if (!level) {
    throw createError({ statusCode: 404, message: "Level not found" });
  }

  // Levels unlock in play order: only solved levels and the first unsolved
  // one can be completed.
  const done = await supabase()
    .from("level_completions")
    .select("level_id")
    .eq("user_id", user.id);
  if (done.error) {
    throw createError({ statusCode: 500, message: done.error.message });
  }
  const solved = new Set(done.data.map((c) => c.level_id));
  const states = levelStates(
    levels.map((l) => l.id),
    (levelId) => solved.has(levelId),
  );
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

  // Only the service role may record completions.
  const { data: best, error: saveError } = await supabase().rpc(
    "record_level_completion",
    {
      p_user_id: user.id,
      p_level_id: level.id,
      p_solution: result.solution,
    },
  );
  if (saveError) {
    throw createError({ statusCode: 500, message: saveError.message });
  }

  return {
    moves: result.moves,
    pushes: result.pushes,
    best: { moves: best.moves, pushes: best.pushes },
  };
});
