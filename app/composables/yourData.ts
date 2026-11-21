/** What this browser keeps for Sokobanko (pages/privacy.vue lists it all). */
const KEY_PREFIX = "sokobanko:";
const COOKIES = [MAP_HINT_COOKIE, MAP_COLUMNS_COOKIE];
/** The upload outbox's database (@tanstack/offline-transactions). */
const OUTBOX_DB = "offline-transactions";

function localKeys(): string[] {
  return Object.keys(localStorage).filter((key) => key.startsWith(KEY_PREFIX));
}

/** A stored value as data: JSON where it is, else the text. */
function parsed(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Progress → Your data, browser only: Sokobanko's part of the download and of
 * the delete. The YourData block (components/YourData.vue) does the rest
 * through Spotcraft's user pool: its file has the account, and deleting the
 * guest there deletes their results on the server too.
 */
export function useYourData() {
  const cookies = COOKIES.map((name) => ({ name, ref: useMapCookie(name) }));

  /** The server's results (/api/me/export) and what this browser keeps. */
  async function exportApp() {
    return {
      site: location.origin,
      server: await $fetch("/api/me/export"),
      browser: {
        localStorage: Object.fromEntries(
          [...localKeys(), "nuxt-color-mode"].map((key) => [
            key,
            parsed(localStorage.getItem(key)),
          ]),
        ),
        cookies: Object.fromEntries(
          cookies.map((cookie) => [cookie.name, cookie.ref.value]),
        ),
      },
    };
  }

  /**
   * After the guest is deleted: clears what this browser keeps, the outbox
   * included, so nothing uploads again, then starts fresh with a full reload.
   * The theme stays: it says nothing about the player.
   */
  async function forget() {
    for (const key of localKeys()) localStorage.removeItem(key);
    for (const cookie of cookies) cookie.ref.value = null;
    // The cookies are written when the refs flush.
    await nextTick();
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(OUTBOX_DB);
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
    location.assign("/");
  }

  return { exportApp, forget };
}
