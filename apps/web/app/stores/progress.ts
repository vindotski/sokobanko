export const useProgressStore = defineStore("progress", () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const completed = ref<string[]>([]);

  /** Reloads the ids of levels the current user has completed. */
  async function load() {
    if (!user.value) {
      completed.value = [];
      return completed.value;
    }
    const { data, error } = await supabase
      .from("level_completions")
      .select("level_id");
    if (error) throw createError({ statusCode: 500, message: error.message });
    completed.value = data.map((row) => row.level_id);
    return completed.value;
  }

  function isCompleted(id: string) {
    return completed.value.includes(id);
  }

  function markCompleted(id: string) {
    if (!isCompleted(id)) completed.value.push(id);
  }

  return { completed, load, isCompleted, markCompleted };
});
