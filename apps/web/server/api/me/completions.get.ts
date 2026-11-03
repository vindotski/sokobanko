/** The signed-in player's best result per level, newest first. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { data, error } = await supabase()
    .from("level_completions")
    .select("level_id, moves, pushes, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});
