import { analytics } from "@kodentuzo/spotkit/client";

/**
 * Counting visits the way the instance allows (Spotcraft's ANALYTICS_MODE):
 * in opt-out mode the tracker loads, unless Spotcraft already adds it to the
 * page; in opt-in mode only after the visitor agrees (Progress → Your data);
 * in server mode, or off Spotcraft, nothing runs.
 */
export default defineNuxtPlugin(() => {
  void analytics().catch(() => undefined);
});
