export interface BestResult {
  moves: number;
  pushes: number;
}

export const useProgressStore = defineStore("progress", () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  // A plain object rather than a Map, so it serializes into the SSR payload.
  const best = ref<Record<string, BestResult>>({});

  /** Reloads the current user's best result for each completed level. */
  async function load() {
    if (!user.value) {
      best.value = {};
      return best.value;
    }
    const { data, error } = await supabase
      .from("level_completions")
      .select("level_id, moves, pushes");
    if (error) throw createError({ statusCode: 500, message: error.message });
    best.value = Object.fromEntries(
      data.map(({ level_id, moves, pushes }) => [level_id, { moves, pushes }]),
    );
    return best.value;
  }

  function isCompleted(id: string) {
    return id in best.value;
  }

  function markCompleted(id: string, result: BestResult) {
    best.value[id] = result;
  }

  return { best, load, isCompleted, markCompleted };
});
