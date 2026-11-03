/** The signed-in player's best result per level, newest first. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const completions = await readProgress(user.id);
  return completions
    .map((c) => ({
      level_id: c.level,
      moves: c.moves,
      pushes: c.pushes,
      completed_at: c.completedAt,
    }))
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
});
