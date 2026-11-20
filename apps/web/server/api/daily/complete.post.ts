import { parseLevel, ReplayError, replay } from "@sokoban/core";

// The same bound as the levels' completion route.
const SOLUTION = /^[lurdLURD]{1,20000}$/;

/**
 * Verifies a solution to today's daily puzzle by replaying it, records it as
 * the player's result for the day if it's their best, and answers the best
 * and their streak. Only today's puzzle counts: a run started before UTC
 * midnight and finished after it is for a puzzle that has ended. No unlock
 * check: the daily is open to every player.
 */
export default defineEventHandler(async (event) => {
  const guest = event.context.guest;
  if (!guest) throw createError({ statusCode: 401, message: "No session" });

  const body = await readBody<{ solution?: unknown; level?: unknown }>(event);
  const solution = body?.solution;
  if (typeof solution !== "string" || !SOLUTION.test(solution)) {
    throw createError({ statusCode: 400, message: "Invalid solution" });
  }

  const daily = dailyFor(await getLevels());
  if (!daily)
    throw createError({ statusCode: 404, message: "No daily puzzle" });
  if (body?.level !== daily.level.id) {
    throw createError({
      statusCode: 409,
      message: "That daily puzzle has ended",
    });
  }

  let run: ReturnType<typeof replay>;
  try {
    run = replay(parseLevel(daily.level), solution);
  } catch (e) {
    if (e instanceof ReplayError) {
      throw createError({ statusCode: 422, message: e.message });
    }
    throw e;
  }
  if (!run.solved) {
    throw createError({ statusCode: 422, message: "Level is not solved" });
  }

  const database = db();
  const best = await recordDaily(database, guest.id, {
    day: daily.day,
    level: daily.level.id,
    moves: run.moves,
    pushes: run.pushes,
  });
  const results = await readDaily(database, guest.id);
  return {
    best: { moves: best.moves, pushes: best.pushes },
    streak: dailyStreak(results, daily.day),
  };
});
