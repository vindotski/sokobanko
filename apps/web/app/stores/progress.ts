export interface BestResult {
  moves: number;
  pushes: number;
}

export const useProgressStore = defineStore("progress", () => {
  const api = useApi();
  // A plain object rather than a Map, so it serializes into the SSR payload.
  const best = ref<Record<string, BestResult>>({});

  /** Reloads the player's best result for each completed level. */
  async function load() {
    // None until the first save; an expired session is a new visitor.
    const data = await api("/api/me/completions").catch(() => []);
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
