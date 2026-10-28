import { levelStates, parseLevel, ReplayError, replay } from "@sokoban/core";
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

  // Levels unlock in play order: only solved levels and the first unsolved
  // one can be completed.
  const [order, done] = await Promise.all([
    // Same order as useLevels() in app/composables/levels.ts.
    supabase
      .from("levels")
      .select("id")
      .eq("status", "published")
      .order("position", { nullsFirst: false })
      .order("created_at"),
    // RLS limits this to the user's own completions.
    supabase.from("level_completions").select("level_id"),
  ]);
  const queryError = order.error ?? done.error;
  if (queryError) {
    throw createError({ statusCode: 500, message: queryError.message });
  }
  const solved = new Set((done.data ?? []).map((c) => c.level_id));
  const states = levelStates(
    (order.data ?? []).map((l) => l.id),
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
  const { data: best, error: saveError } = await serverSupabaseServiceRole(
    event,
  ).rpc("record_level_completion", {
    p_user_id: user.sub,
    p_level_id: level.id,
    p_solution: result.solution,
  });
  // A validly signed session for a user that no longer exists, e.g. after a
  // local database reset or a deleted account.
  if (
    saveError?.code === "23503" &&
    saveError.message.includes("level_completions_user_id_fkey")
  ) {
    throw createError({ statusCode: 401, message: "Session expired" });
  }
  if (saveError) {
    throw createError({ statusCode: 500, message: saveError.message });
  }

  return {
    moves: result.moves,
    pushes: result.pushes,
    best: { moves: best.moves, pushes: best.pushes },
  };
});
