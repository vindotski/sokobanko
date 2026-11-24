import { analytics } from "@kodentuzo/spotkit/client";

/**
 * Counting visits, the one way the instance does (Spotless): the script sets
 * no cookie and stores nothing on the device, so there is no consent and no
 * opt-out, and it isn't behind the storage switch. Off Spotcraft, or with no
 * analytics path in config.json, nothing loads.
 */
export default defineNuxtPlugin(() => {
  void analytics().catch(() => undefined);
});
