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
 * Progress → Your data (DataControls), browser only: everything about the
 * player as a file, or all of it deleted.
 */
export function useYourData() {
  const pool = useUserPool();
  const cookies = COOKIES.map((name) => ({ name, ref: useMapCookie(name) }));
  const busy = ref<"download" | "delete">();
  const error = ref<string>();

  /** The server's part (/api/me/export) and this browser's, in one file. */
  async function download() {
    busy.value = "download";
    error.value = undefined;
    try {
      const server = await $fetch("/api/me/export");
      const data = {
        exportedAt: new Date().toISOString(),
        site: location.origin,
        server,
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
      const url = URL.createObjectURL(
        new Blob([`${JSON.stringify(data, null, 2)}\n`], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "sokobanko-data.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      error.value = "Couldn't reach the server for your data; try again soon.";
    } finally {
      busy.value = undefined;
    }
  }

  /**
   * Deletes the results on the server, signs out of the user pool, and clears
   * what this browser keeps, the outbox included, so nothing uploads again.
   * Then a fresh start: a full reload drops what the page holds in memory.
   * The theme stays: it says nothing about the player.
   */
  async function erase() {
    busy.value = "delete";
    error.value = undefined;
    try {
      await $fetch("/api/me/progress", { method: "DELETE" });
      await pool.signOut();
    } catch {
      busy.value = undefined;
      error.value =
        "Couldn't reach the server to delete your data; try again soon.";
      return;
    }
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

  return { busy, error, download, erase };
}
