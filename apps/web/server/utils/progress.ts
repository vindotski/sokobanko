import {
  type Completion,
  completionsFrom,
  playerPath,
  toMarkdown,
  withBest,
} from "../spotcraft/progress";
import { rpc, SpotcraftRpcError } from "../spotcraft/rpc";

const PROJECT = "sokobanko";

/**
 * The player's best results, from `progress/<id>.md` in the sokobanko project,
 * through Spotcraft's delivery API (with the key, once the project is
 * private). No file yet means no results.
 */
export async function readProgress(userId: string): Promise<Completion[]> {
  const { spotcraftUrl } = useRuntimeConfig();
  const path = playerPath(userId).replace(/\.md$/, "");
  try {
    const doc = await $fetch<{ data: unknown }>(
      `/v1/projects/${PROJECT}/content/${path}`,
      { baseURL: spotcraftUrl, headers: deliveryHeaders() },
    );
    return completionsFrom(doc.data);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return [];
    throw error;
  }
}

/**
 * Records a run, already replayed and verified, and answers the player's best
 * for that level. Only a run with fewer moves than the best is saved, as one
 * commit on main, with Sokobanko's key (players can't write content). Every
 * player's save moves main, so a save that finds it moved is retried.
 */
export async function recordBest(
  userId: string,
  run: Completion,
): Promise<Completion> {
  const { spotcraftUrl } = useRuntimeConfig();
  const credentials = spotcraftCredentials();
  if (!credentials) {
    throw createError({
      statusCode: 500,
      message: "Saving results isn't configured",
    });
  }
  const call = <T>(procedure: string, input: unknown) =>
    rpc<T>(spotcraftUrl, credentials, procedure, input);

  for (let attempt = 1; attempt <= 5; attempt++) {
    // main first, then the file: if main moves after this, the save conflicts.
    const refs = await call<{ name: string; commit: string }[]>("refs.list", {
      project: PROJECT,
    });
    const base = refs.find((r) => r.name === "main")?.commit;
    if (!base)
      throw createError({ statusCode: 500, message: `${PROJECT} has no main` });

    const { completions, best, improved } = withBest(
      await readProgress(userId),
      run,
    );
    if (!improved) return best;
    try {
      await call("files.save", {
        project: PROJECT,
        ref: "main",
        base,
        message: `progress: ${run.level} in ${run.moves} moves`,
        changes: [
          { path: playerPath(userId), content: toMarkdown(completions) },
        ],
        author: { name: "Sokobanko", email: "progress@sokobanko.vin.ski" },
      });
      return best;
    } catch (error) {
      if (error instanceof SpotcraftRpcError && error.code === "CONFLICT")
        continue;
      if (error instanceof SpotcraftRpcError && error.code === "INVALID") {
        console.error(
          "Spotcraft refused a progress file:",
          JSON.stringify(error.data),
        );
      }
      throw error;
    }
  }
  throw createError({
    statusCode: 503,
    message: "Spotcraft is busy; try again",
  });
}
