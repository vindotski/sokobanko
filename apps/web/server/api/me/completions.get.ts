/** The signed-in player's best result per level, newest first. */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  // requireUser has checked it: it says whose records they are.
  const completions = await readProgress(sessionToken(event) as string);
  return completions
    .map((c) => ({
      level_id: c.level,
      moves: c.moves,
      pushes: c.pushes,
      completed_at: c.completedAt,
    }))
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
});
