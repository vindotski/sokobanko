import { utcDay } from "@sokoban/core";

/**
 * The player's daily streak, and today's best if they've solved it. Nothing
 * before their first save.
 */
export default defineEventHandler(async (event) => {
  const guest = event.context.guest;
  const today = utcDay(new Date());
  if (!guest) return { today: null, streak: 0 };
  const results = await readDaily(db(), guest.id);
  const mine = results.find((r) => r.day === today);
  return {
    today: mine ? { moves: mine.moves, pushes: mine.pushes } : null,
    streak: dailyStreak(results, today),
  };
});
