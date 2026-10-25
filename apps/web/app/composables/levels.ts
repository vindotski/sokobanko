const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Published levels in play order. */
export function useLevels() {
  const supabase = useSupabaseClient();
  return useAsyncData("levels", async () => {
    const { data, error } = await supabase
      .from("levels")
      .select("id, title, map")
      .eq("status", "published")
      .order("position", { nullsFirst: false })
      .order("created_at");
    if (error) throw createError({ statusCode: 500, message: error.message });
    return data;
  });
}

/** Ids of published levels, without their maps. */
export function useLevelIds() {
  const supabase = useSupabaseClient();
  return useAsyncData("level-ids", async () => {
    const { data, error } = await supabase
      .from("levels")
      .select("id")
      .eq("status", "published");
    if (error) throw createError({ statusCode: 500, message: error.message });
    return data.map((level) => level.id);
  });
}

/** One level the viewer can see, or `null` if there is none with that id. */
export function useLevel(id: string) {
  const supabase = useSupabaseClient();
  return useAsyncData(`level-${id}`, async () => {
    // Postgres rejects malformed uuids instead of returning nothing.
    if (!UUID.test(id)) return null;
    const { data, error } = await supabase
      .from("levels")
      .select("id, title, map")
      .eq("id", id)
      .maybeSingle();
    if (error) throw createError({ statusCode: 500, message: error.message });
    return data;
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
        .select("moves, pushes, completed_at, level:levels (id, title)")
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
