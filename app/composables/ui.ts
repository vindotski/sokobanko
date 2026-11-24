import type { LevelRef, LevelState } from "@sokoban/core";

/** The Settings sheet, opened from any page's header or the sidebar. */
export const useSettingsOpen = () => useState("settings-open", () => false);

export interface ProgressView {
  /**
   * Where the states come from: nowhere yet (a first visit, a search engine,
   * or a browser that hasn't read its progress), the map hint cookie
   * (utils/mapHint.ts), or the browser's own progress.
   */
  source: "none" | "hint" | "live";
  /** Each level's state, by id. */
  states: Record<string, LevelState>;
  /** Best results; only once live. */
  best: Record<string, { moves: number; pushes: number }>;
  /** Levels whose best here hasn't reached the server yet; only once live. */
  unsynced: string[];
}

/**
 * The player's progress, for server-rendered pages (the map, level cards).
 * On the server it's what the map hint says (seedProgressView), or empty;
 * the browser starts from the same, so the HTML matches, until ProgressSync
 * fills in the real progress.
 */
export const useProgressView = () =>
  useState<ProgressView>("progress-view", () => ({
    source: "none",
    states: {},
    best: {},
    unsynced: [],
  }));

/**
 * One of the map's cookies (utils/mapHint.ts), as written: plain text. Null
 * when there's none; setting null removes it.
 */
export const useMapCookie = (name: string) =>
  useCookie<string | null>(name, {
    maxAge: MAP_COOKIE_MAX_AGE,
    sameSite: "lax",
    default: () => null,
    encode: (v) => v ?? "",
    decode: (v: string): string | null => v,
  });

/**
 * On the server, fills the progress view from the map hint cookie, if the
 * browser sent one, so the map is drawn as the player left it. Responses that
 * used it are the player's own: no shared cache keeps them.
 */
export function seedProgressView(levels: readonly LevelRef[] | undefined) {
  if (!import.meta.server || !levels?.length) return;
  const view = useProgressView();
  const hint = parseHint(useMapCookie(MAP_HINT_COOKIE).value);
  if (!hint || view.value.source !== "none") return;
  view.value = {
    ...view.value,
    source: "hint",
    states: Object.fromEntries(statesFromHint(levels, hint)),
  };
  useResponseHeader("cache-control").value = "private, no-cache";
}
