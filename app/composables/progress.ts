import { isBetter, type LevelState, levelStates } from "@sokobanko/core";
import { useLiveQuery } from "@tanstack/vue-db";
import { useQuery } from "@tanstack/vue-query";
import { localData } from "~/collections";

export interface BestResult {
  moves: number;
  pushes: number;
}

/**
 * The levels, their collections and the player's progress, live from the
 * browser's collections (collections/index.ts). Browser only: the pages that
 * use it aren't server-rendered (routeRules).
 */
export function useProgress() {
  const data = localData();
  const levelsQuery = useLiveQuery(data.levels);
  const collectionsQuery = useLiveQuery(data.levelCollections);
  const verifiedQuery = useLiveQuery(data.verified);
  const verified = verifiedQuery.data;
  const { data: runs } = useLiveQuery(data.runs);

  /** Every level, in play order. */
  const levels = computed(() =>
    [...levelsQuery.data.value].sort((a, b) => a.position - b.position),
  );
  const collections = computed(() =>
    [...collectionsQuery.data.value].sort((a, b) => a.position - b.position),
  );

  const verifiedById = computed(
    () => new Map(verified.value.map((v) => [v.levelId, v])),
  );
  const runsById = computed(
    () => new Map(runs.value.map((r) => [r.levelId, r])),
  );

  /** The better of the server's verified best and this browser's run, per level. */
  const best = computed(() => {
    const merged: Record<string, BestResult> = {};
    for (const v of verified.value) {
      merged[v.levelId] = { moves: v.moves, pushes: v.pushes };
    }
    for (const r of runs.value) {
      if (isBetter(r, merged[r.levelId])) {
        merged[r.levelId] = { moves: r.moves, pushes: r.pushes };
      }
    }
    return merged;
  });

  /** Each level's state; collections unlock on their own, as on the server. */
  const states = computed<Map<string, LevelState>>(() =>
    levelStates(levels.value, (id) => id in best.value),
  );

  /** Whether a level's best here is still waiting for the server. */
  function isUnsynced(id: string) {
    const run = runsById.value.get(id);
    return !!run && isBetter(run, verifiedById.value.get(id));
  }

  /** The completions to list, newest first, each marked if not synced yet. */
  const completions = computed(() => {
    const titles = new Map(levels.value.map((l) => [l.id, l.title]));
    return Object.keys(best.value)
      .flatMap((id) => {
        const title = titles.get(id);
        if (!title) return [];
        const synced = !isUnsynced(id);
        const v = verifiedById.value.get(id);
        const r = runsById.value.get(id);
        return [
          {
            levelId: id,
            title,
            moves: best.value[id]?.moves ?? 0,
            pushes: best.value[id]?.pushes ?? 0,
            completedAt:
              (synced ? (v?.completedAt ?? r?.solvedAt) : r?.solvedAt) ?? "",
            synced,
          },
        ];
      })
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  });

  /**
   * Ready once the levels have loaded and the server's bests have answered (or
   * couldn't be reached: offline, local progress is all there is). Runs solved
   * here are in localStorage, so they're there at once.
   */
  const isReady = computed(
    () =>
      levelsQuery.isReady.value &&
      collectionsQuery.isReady.value &&
      (verifiedQuery.isReady.value ||
        verifiedQuery.isLoadingError.value ||
        verifiedQuery.isCrashed.value),
  );

  return {
    levels,
    collections,
    best,
    states,
    isUnsynced,
    completions,
    isReady,
    rejected: data.rejected,
    recordSolve: data.recordSolve,
  };
}

/** The visitor's guest, from /api/me; null until their first save. */
export function useAccount() {
  return useQuery(
    {
      queryKey: ["me", "account"],
      queryFn: async () => (await $fetch("/api/me")).guest,
    },
    // The collections' client, passed in rather than installed app-wide, so
    // TanStack stays out of the entry chunk.
    localData().queryClient,
  );
}
