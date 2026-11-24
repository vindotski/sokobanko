import { isBetter, pendingUploads } from "@sokoban/core";
import {
  type Collection,
  createCollection,
  localStorageCollectionOptions,
  type Transaction,
} from "@tanstack/db";
import {
  NonRetriableError,
  startOfflineExecutor,
} from "@tanstack/offline-transactions";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { QueryClient } from "@tanstack/vue-query";
import { RetryLater, shouldRetryUpload, uploadOutcome } from "./upload";

/**
 * The browser's data, local first (TanStack DB). Levels, collections and the
 * server's verified bests are read through TanStack Query; the runs solved in
 * this browser live in localStorage, and uploading them goes through a
 * durable outbox in IndexedDB (offline-transactions), so a solve counts at
 * once and reaches the server whenever it can. Browser only: made on first
 * use, by plugins/tanstack.client.ts.
 *
 * Nothing is stored on the device until Spotkit's storage switch is on, which
 * the player's first click on a level turns on (composables/storage.ts). Until
 * then there is no outbox; `startStoring` starts it, at that click or, on a
 * later visit, as soon as the pool shows the switch was on.
 */

type ApiLevel = Awaited<ReturnType<typeof fetchLevels>>[number];
export type Level = ApiLevel & { position: number };
type ApiCollection = Awaited<ReturnType<typeof fetchCollections>>[number];
export type LevelCollection = ApiCollection & { position: number };

/** A best the server has verified. */
export interface Verified {
  levelId: string;
  moves: number;
  pushes: number;
  /** ISO 8601. */
  completedAt: string;
}

/** A run solved in this browser: its best for the level, with its input log. */
export interface Run {
  levelId: string;
  /** Everything played, undos included (GameProgress.log). */
  log: string;
  moves: number;
  pushes: number;
  /** ISO 8601. */
  solvedAt: string;
  /** When it last went into the outbox, so queueing it again is a change. */
  queuedAt: string;
}

const fetchLevels = () => $fetch("/api/levels");
const fetchCollections = () => $fetch("/api/collections");

const RUNS = "sokoban:runs:v2";

function create() {
  // The user pool's client reads the runtime config, which uploads made later
  // by the outbox can't; make it now (create runs with the app's context).
  useUserPool();

  // Batches requests to queue runs again (requeueMissing): one solve in
  // another tab, or taking over the outbox, can bring several.
  let requeueTimer: ReturnType<typeof setTimeout> | undefined;
  function requeueSoon() {
    clearTimeout(requeueTimer);
    requeueTimer = setTimeout(() => {
      requeueMissing().catch((error) =>
        console.error("Could not queue runs for the server:", error),
      );
    }, 500);
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
  });

  // Levels and collections, in play order (their position in the response).
  const levels = createCollection(
    queryCollectionOptions({
      id: "levels",
      queryKey: ["levels"],
      queryFn: async () =>
        (await fetchLevels()).map((level, position) => ({
          ...level,
          position,
        })),
      queryClient,
      getKey: (level) => level.id,
    }),
  );
  const levelCollections = createCollection(
    queryCollectionOptions({
      id: "collections",
      queryKey: ["collections"],
      queryFn: async () =>
        (await fetchCollections()).map((collection, position) => ({
          ...collection,
          position,
        })),
      queryClient,
      getKey: (collection) => collection.id,
    }),
  );

  // The server's verified bests; none before the first save. A failed fetch
  // keeps what was there, so going offline doesn't forget them.
  const verified = createCollection(
    queryCollectionOptions({
      id: "verified",
      queryKey: ["me", "completions"],
      queryFn: async (): Promise<Verified[]> =>
        (await $fetch("/api/me/completions")).map((c) => ({
          levelId: c.level_id,
          moves: c.moves,
          pushes: c.pushes,
          completedAt: c.completed_at,
        })),
      queryClient,
      getKey: (best) => best.levelId,
    }),
  );

  const runs = createCollection(
    localStorageCollectionOptions<Run, string>({
      id: "runs",
      storageKey: RUNS,
      getKey: (run) => run.levelId,
    }),
  );

  /**
   * The upload outbox (IndexedDB, and a lock in localStorage), started by
   * `startStoring`: starting it stores something on the device.
   */
  let executor: ReturnType<typeof startOfflineExecutor> | undefined;
  let recordRun: ReturnType<typeof makeRecordRun> | undefined;

  function startStoring() {
    if (executor) return;
    executor = startOfflineExecutor({
      collections: { runs: runs as unknown as Collection },
      mutationFns: {
        uploadRun: async ({ transaction }) => {
          for (const mutation of transaction.mutations) {
            const run = mutation.modified as unknown as Run;
            await upload(run.levelId, run.log);
          }
          runs.utils.acceptMutations(transaction);
          await Promise.all([
            verified.utils.refetch(),
            queryClient.invalidateQueries({ queryKey: ["me", "account"] }),
          ]);
        },
      },
      shouldRetry: shouldRetryUpload,
      // A tab that takes over the outbox picks up what others left.
      onLeadershipChange: (isLeader) => {
        if (isLeader) requeueSoon();
      },
    });
    recordRun = makeRecordRun(executor);
    requeueSoon();
  }

  /** Sends a run's log to the server, which replays it (complete.post.ts). */
  async function upload(levelId: string, log: string) {
    const post = () =>
      $fetch(`/api/levels/${levelId}/complete`, {
        method: "POST",
        body: { log },
      });
    const status = (error: unknown) =>
      (error as { statusCode?: number }).statusCode;
    try {
      await post();
    } catch (error) {
      let failure = error;
      // No session yet, or it ended: a guest in the user pool, then again.
      if (status(error) === 401) {
        try {
          await ensureGuest();
          await post();
          return;
        } catch (again) {
          failure = again;
        }
      }
      if (uploadOutcome(status(failure)) === "drop") {
        throw new NonRetriableError(
          `The server refused the run for ${levelId}`,
        );
      }
      throw new RetryLater(status(failure));
    }
  }

  /** Levels whose run the server refused, so the solved dialog can say so. */
  const rejected = ref(new Set<string>());

  const makeRecordRun = (offline: NonNullable<typeof executor>) =>
    offline.createOfflineAction<Run>({
      mutationFnName: "uploadRun",
      onMutate: (run) => {
        if (runs.has(run.levelId)) {
          runs.update(run.levelId, (draft) => Object.assign(draft, run));
        } else {
          runs.insert(run);
        }
      },
    });

  /** Levels queued in this tab and not settled yet, so none goes in twice. */
  const inFlight = new Set<string>();

  /** Queues a run for the server; the UI sees it at once. */
  function queue(run: Run) {
    if (!recordRun) return;
    rejected.value.delete(run.levelId);
    inFlight.add(run.levelId);
    const transaction = recordRun({
      ...run,
      queuedAt: new Date().toISOString(),
    });
    track(transaction, run.levelId);
  }

  function track(transaction: Transaction, levelId: string) {
    // Settles once uploaded, or rejects if the server refused the run; a run
    // waiting to retry stays pending.
    transaction
      .when("settled")
      .catch(() => {
        rejected.value = new Set(rejected.value).add(levelId);
      })
      .finally(() => inFlight.delete(levelId));
  }

  /**
   * Records a run solved here, if it beats this browser's best for the level.
   * The tab that runs the outbox queues it for the server; another tab (only
   * one tab runs it) keeps it in localStorage, which every tab shares, and the
   * outbox's tab queues it from there (requeueMissing), so it isn't lost when
   * that upload would fail offline.
   */
  async function recordSolve(
    levelId: string,
    run: Omit<Run, "levelId" | "queuedAt">,
  ) {
    // A solve comes after the player's first click on a level, so storing is
    // already on; this only makes sure the outbox is there.
    startStoring();
    const offline = executor;
    if (!offline) return;
    await offline.waitForInit();
    if (!isBetter(run, runs.get(levelId))) return;
    const solved: Run = { levelId, ...run, queuedAt: "" };
    if (offline.isOfflineEnabled) {
      queue(solved);
    } else if (runs.has(levelId)) {
      runs.update(levelId, (draft) => Object.assign(draft, solved));
    } else {
      runs.insert(solved);
    }
  }

  /**
   * Runs the server doesn't have, or has worse, and that aren't in the outbox
   * (the guest was replaced, or progress came from before the outbox): queued
   * again in play order. Only the tab that runs the outbox does this.
   */
  async function requeueMissing() {
    // Before the player's first click there is no outbox, and nothing to send.
    const offline = executor;
    if (!offline) return;
    await offline.waitForInit();
    if (!offline.isOfflineEnabled) {
      // Another tab runs the outbox; when it saves a run, the change reaches
      // this tab through localStorage, and the server's bests are fresh.
      await verified.utils.refetch();
      return;
    }
    // Offline, the server's bests may not load: then only what this browser
    // hasn't queued yet goes in, compared with nothing.
    await Promise.all([levels.preload(), verified.preload().catch(() => {})]);
    const queued = new Set(
      (await offline.peekOutbox()).flatMap((tx) =>
        tx.mutations.map((m) => String(m.key)),
      ),
    );
    const ordered = [...levels.values()].sort(
      (a, b) => a.position - b.position,
    );
    const local = Object.fromEntries(
      [...runs.values()].map((r) => [r.levelId, r]),
    );
    const server = Object.fromEntries(
      [...verified.values()].map((v) => [v.levelId, v]),
    );
    for (const id of pendingUploads(ordered, local, server)) {
      const run = local[id];
      if (run && !queued.has(id) && !inFlight.has(id)) queue(run);
    }
  }

  // Runs written by other tabs arrive through localStorage's storage events;
  // the outbox's tab queues them.
  runs.subscribeChanges(requeueSoon);

  return {
    queryClient,
    levels,
    levelCollections,
    verified,
    runs,
    startStoring,
    rejected,
    recordSolve,
  };
}

let instance: ReturnType<typeof create> | undefined;

/**
 * The browser's collections and outbox, made on first use: in a page's setup,
 * or by plugins/tanstack.client.ts. Browser only.
 */
export function localData() {
  if (import.meta.server) {
    throw new Error("The local collections are only available in the browser");
  }
  instance ??= create();
  return instance;
}
