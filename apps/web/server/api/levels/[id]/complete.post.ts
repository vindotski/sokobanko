import { parseLevel, ReplayError, replay } from "@sokobanko/core";
import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from "#supabase/server";

// Generous upper bound; real solutions are hundreds of moves at most.
const SOLUTION = /^[lurdLURD]{1,20000}$/;

/**
 * Verifies a solution by replaying it, then records it as the user's
 * completion. Clients cannot write completions themselves.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) throw createError({ statusCode: 401, message: "No session" });

  const body = await readBody<{ solution?: unknown }>(event);
  const solution = body?.solution;
  if (typeof solution !== "string" || !SOLUTION.test(solution)) {
    throw createError({ statusCode: 400, message: "Invalid solution" });
  }

  // As the user, so RLS decides which levels exist for them.
  const id = getRouterParam(event, "id") ?? "";
  const supabase = await serverSupabaseClient(event);
  const { data: level, error } = await supabase
    .from("levels")
    .select("id, title, map")
    .eq("id", id)
    .maybeSingle();
  // An id that is not a uuid fails the query; treat it as not found.
  if (error && error.code !== "22P02") {
    throw createError({ statusCode: 500, message: error.message });
  }
  if (!level) {
    throw createError({ statusCode: 404, message: "Level not found" });
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
  const { data: best, error: saveError } = await serverSupabaseServiceRole(
    event,
  ).rpc("record_level_completion", {
    p_user_id: user.sub,
    p_level_id: level.id,
    p_solution: result.solution,
  });
  if (saveError) {
    throw createError({ statusCode: 500, message: saveError.message });
  }

  return {
    moves: result.moves,
    pushes: result.pushes,
    best: { moves: best.moves, pushes: best.pushes },
  };
});
