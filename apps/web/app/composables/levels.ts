/**
 * Published levels in play order, from Spotcraft through server/api/levels.
 * The completion route in server/api/levels/[id]/complete.post.ts uses the
 * same list and order for unlocking.
 */
export function useLevels() {
  return useFetch("/api/levels", { key: "levels" });
}

/** Ids of published levels, in play order. */
export function useLevelIds() {
  return useFetch("/api/levels", {
    key: "level-ids",
    transform: (levels) => levels.map((level) => level.id),
  });
}

/** The current user's best completions, newest first. */
export function useCompletions() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  return useAsyncData(
    "my-completions",
    async () => {
      if (!user.value) return [];
      const { data, error } = await supabase
        .from("level_completions")
        .select("level_id, moves, pushes, completed_at")
        .order("completed_at", { ascending: false });
      if (error) {
        throw createError({ statusCode: 500, message: error.message });
      }
      return data;
    },
    // Reload when the session changes, e.g. once anonymous sign-in finishes.
    { watch: [() => user.value?.sub] },
  );
}
