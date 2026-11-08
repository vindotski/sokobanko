/**
 * Levels in play order, from server/api/levels.
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

/** The player's best completions, newest first. */
export function useCompletions() {
  const api = useApi();
  return useAsyncData("my-completions", () =>
    api("/api/me/completions").catch(() => []),
  );
}
