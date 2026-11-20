/**
 * Ids of published levels, in play order, for the server-rendered home page.
 * The other pages read levels from the browser's collections (useProgress).
 */
export function useLevelIds() {
  return useFetch("/api/levels", {
    key: "level-ids",
    transform: (levels) => levels.map((level) => level.id),
  });
}
