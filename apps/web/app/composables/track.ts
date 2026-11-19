/**
 * Product events, sent to the Umami that Spotcraft runs for this app.
 *
 * Spotcraft injects Umami's tracker (`/_spotcraft/s.js`) into every page and
 * counts page views on its own; these are the moments a page view can't
 * show. Spotcraft's rule is no ids and no personal data, so every field here
 * is a count or a name shared by all players. See docs/product.md.
 */
export interface TrackEvents {
  /** The player's first move on a visit to the level, resumed runs too. */
  level_start: { level: string; collection: string };
  /** A run solved the level, before the server checks it. */
  level_solve: {
    level: string;
    collection: string;
    moves: number;
    pushes: number;
    first: boolean;
  };
  /**
   * Restart (R or the button) on an unsolved board: not undoing back to the
   * start, and not Replay after a solve.
   */
  level_restart: { level: string; moves: number };
  /** "Got it" on the first-time hint, and how far into the run they were. */
  hint_dismissed: { level: string; moves: number };
}

type Umami = {
  track: (
    event: string,
    data?: Record<string, string | number | boolean>,
  ) => void;
};

/**
 * Sends one event. Does nothing on the server, when analytics is off for the
 * app, when the visitor opted out, or when a blocker stopped the script, and
 * never throws: analytics mustn't break the game.
 */
export function track<E extends keyof TrackEvents>(
  event: E,
  data: TrackEvents[E],
) {
  if (import.meta.server) return;
  try {
    (window as { umami?: Umami }).umami?.track(event, data);
  } catch {}
}
