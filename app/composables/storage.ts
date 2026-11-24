import { storageSwitch } from "@kodentuzo/spotkit/client";

/**
 * Nothing is stored on the device before the player acts. Spotkit's storage
 * switch is off until their first click on a level (`startStoring`, from
 * plugins/storage.client.ts) or their first move on a level opened from a link (pages/play/[id].vue);
 * only then does the browser keep anything (the outbox of results, a half-played
 * level, the sound setting) or make a guest in the user pool. A later visit
 * finds the switch on by the pool's session cookie (`restoreStorage`).
 * Browser only.
 */

/** Whether the app may write to the device now. */
export const storing = () => storageSwitch.isOn();

/** @nuxtjs/color-mode's key; it writes it on load and on every change. */
const THEME_KEY = "nuxt-color-mode";

/** The theme module's own write is undone while storage is off (plugins/storage.client.ts). */
export function forgetThemeUntilStoring() {
  if (storing()) return;
  try {
    localStorage.removeItem(THEME_KEY);
  } catch {}
}

/** The player's action that asks for storage: turns the switch on, starts the outbox. */
export async function startStoring(): Promise<void> {
  // The collections need the app's context, which is gone after the import.
  const nuxtApp = useNuxtApp();
  storageSwitch.turnOn();
  // The theme chosen so far, which was only kept for this visit.
  try {
    localStorage.setItem(THEME_KEY, nuxtApp.$colorMode.preference);
  } catch {}
  const { localData } = await import("~/collections");
  nuxtApp.runWithContext(() => localData().startStoring());
}

/** On a visit, starts the outbox if the pool knows a session for this browser. Creates nothing. */
export async function restoreStorage(): Promise<void> {
  // Offline, or with the pool out of reach, the switch stays off until the
  // player's next action turns it on.
  const on = await storageSwitch.restore().catch(() => false);
  if (on) await startStoring();
}
