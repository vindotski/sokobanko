import { isBetter, pendingUploads, type Score } from "@sokobanko/core";

export type BestResult = Score;

/** A run solved in this browser, kept with its input log so it can be uploaded later. */
export interface LocalRun extends Score {
  /** Everything played in the run, undos included (GameProgress.log). */
  log: string;
  /** ISO 8601. */
  solvedAt: string;
}

const STORAGE_KEY = "sokobanko:progress:v1";

/** A stored run, from before logs too: those kept a plain `solution`, a log without undos. */
const toLocalRun = (run: unknown): LocalRun | undefined => {
  const r = run as (Partial<LocalRun> & { solution?: unknown }) | null;
  const log = r?.log ?? r?.solution;
  if (
    typeof log === "string" &&
    Number.isInteger(r?.moves) &&
    Number.isInteger(r?.pushes) &&
    typeof r?.solvedAt === "string"
  ) {
    return {
      log,
      moves: r.moves as number,
      pushes: r.pushes as number,
      solvedAt: r.solvedAt as string,
    };
  }
};

const statusOf = (error: unknown) =>
  (error as { statusCode?: number }).statusCode;

/**
 * The player's progress, local first. Solves count as soon as they happen in
 * this browser (`local`, kept in localStorage), so the next level unlocks even
 * when the server can't be reached. `sync` then uploads them; the server
 * replays each one and keeps the verified best (`server`). `best` is the
 * better of the two for each level.
 */
export const useProgressStore = defineStore("progress", () => {
  const api = useApi();
  // Plain objects rather than Maps, so they serialize into the SSR payload.
  const server = ref<Record<string, BestResult>>({});
  const local = ref<Record<string, LocalRun>>({});
  /** Whether this browser's progress has been read; never on the server. */
  const localReady = ref(false);
  const syncing = ref(false);
  /** Levels whose run here the server refused, from the last sync. */
  const rejected = ref<string[]>([]);

  const best = computed(() => {
    const merged: Record<string, BestResult> = { ...server.value };
    for (const [id, { moves, pushes }] of Object.entries(local.value)) {
      if (isBetter({ moves, pushes }, merged[id])) {
        merged[id] = { moves, pushes };
      }
    }
    return merged;
  });

  /** Whether the level's best here is still waiting for the server. */
  function isUnsynced(id: string) {
    const run = local.value[id];
    return !!run && isBetter(run, server.value[id]);
  }

  /** Reloads the player's verified results from the server. */
  async function load() {
    // None until the first save; an expired session is a new visitor.
    const data = await api("/api/me/completions").catch(() => []);
    server.value = Object.fromEntries(
      data.map(({ level_id, moves, pushes }) => [level_id, { moves, pushes }]),
    );
    return best.value;
  }

  /** Reads this browser's progress. Storage can be missing or blocked (private windows): then it's only kept in memory. */
  function restoreLocal() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      // Anything solved in memory before the read wins if it's better.
      for (const [id, entry] of Object.entries(stored ?? {})) {
        const run = toLocalRun(entry);
        if (run && isBetter(run, local.value[id])) local.value[id] = run;
      }
    } catch {}
    localReady.value = true;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local.value));
    } catch {}
  }

  /** Records a run solved here, if it's this browser's best for the level. */
  function recordSolve(id: string, run: LocalRun) {
    rejected.value = rejected.value.filter((r) => r !== id);
    if (!isBetter(run, local.value[id])) return;
    local.value[id] = run;
    persist();
  }

  function drop(id: string) {
    delete local.value[id];
    rejected.value.push(id);
    persist();
  }

  const save = (id: string, log: string) =>
    $fetch<{ best: BestResult }>(`/api/levels/${id}/complete`, {
      method: "POST",
      body: { log },
    });

  async function upload(id: string, log: string) {
    try {
      return await save(id, log);
    } catch (error) {
      // Their session ended since: a new guest, then save again.
      if (statusOf(error) !== 401) throw error;
      await ensureGuest();
      return save(id, log);
    }
  }

  let running: Promise<void> | undefined;

  /**
   * Uploads the runs the server doesn't have yet, in play order, so its own
   * unlocking accepts each in turn. Stops at the first error that a later try
   * could fix (offline, the server down, too many requests). A run the server
   * refuses as not solving the level is dropped here too: the server is the
   * authority. One sync at a time; browser only.
   */
  function sync() {
    running ??= run().finally(() => {
      running = undefined;
    });
    return running;
  }

  async function run() {
    if (!localReady.value) return;
    if (!Object.keys(local.value).some(isUnsynced)) return;
    syncing.value = true;
    try {
      const levels = await $fetch("/api/levels");
      const ids = pendingUploads(levels, local.value, server.value);
      if (!ids.length) return;
      // A first save needs a guest: the browser makes one in the user pool.
      const wasGuest = Object.keys(server.value).length > 0;
      if (!wasGuest) await ensureGuest();
      let saved = 0;
      for (const id of ids) {
        const entry = local.value[id];
        if (!entry) continue;
        try {
          const result = await upload(id, entry.log);
          server.value[id] = result.best;
          saved++;
        } catch (error) {
          const status = statusOf(error);
          // Doesn't solve the level, or the level is gone.
          if (status === 400 || status === 404 || status === 422) drop(id);
          // An earlier level of its collection isn't saved yet; next time.
          else if (status === 403) continue;
          else break;
        }
      }
      if (saved) {
        // The first save is what makes the visitor a guest.
        refreshNuxtData(
          wasGuest ? "my-completions" : ["account", "my-completions"],
        );
      }
    } catch {
      // Offline, or the server or user pool is unavailable: next time.
    } finally {
      syncing.value = false;
    }
  }

  return {
    server,
    local,
    localReady,
    syncing,
    rejected,
    best,
    isUnsynced,
    load,
    restoreLocal,
    recordSolve,
    sync,
  };
});
