/** The player's best result per level, newest first; none before their first save. */
export default defineEventHandler(async (event) => {
  const guest = event.context.guest;
  if (!guest) return [];
  await databaseReady();
  const completions = await readProgress(backend().db, guest.id);
  return completions
    .map((c) => ({
      level_id: c.level,
      moves: c.moves,
      pushes: c.pushes,
      completed_at: c.completedAt,
    }))
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
});
