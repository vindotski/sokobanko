import type { LevelState } from "@sokobanko/core";

/** The Settings sheet, opened from any page's header or the sidebar. */
export const useSettingsOpen = () => useState("settings-open", () => false);

export interface ProgressView {
  /** False on the server and until the browser has read its progress. */
  ready: boolean;
  /** Each level's state, by id. */
  states: Record<string, LevelState>;
  best: Record<string, { moves: number; pushes: number }>;
  /** Levels whose best here hasn't reached the server yet. */
  unsynced: string[];
}

/**
 * The player's progress, for server-rendered pages (the map, level cards):
 * empty on the server and during hydration, so the HTML matches, then filled
 * in by ProgressSync once the browser's collections have loaded.
 */
export const useProgressView = () =>
  useState<ProgressView>("progress-view", () => ({
    ready: false,
    states: {},
    best: {},
    unsynced: [],
  }));
