import { createAuthClient } from "better-auth/client";
import { anonymousClient } from "better-auth/client/plugins";

let pool: ReturnType<typeof makePool> | undefined;

const makePool = (baseURL: string) =>
  createAuthClient({ baseURL, plugins: [anonymousClient()] });

/**
 * Spotcraft's user pool, from the browser: it answers at /_spotcraft/auth on
 * the app's own domain (on Spotcraft, and through the dev server's proxy
 * locally), so its session cookie is first-party. Browser only.
 */
export function useUserPool() {
  // Made once, from the plugin (plugins/tanstack.client.ts): later calls come
  // from the upload outbox, outside any component, where the runtime config
  // isn't available.
  pool ??= makePool(
    useRuntimeConfig().public.authUrl ||
      new URL("/_spotcraft/auth", location.origin).href,
  );
  return pool;
}

/**
 * Makes the visitor a guest in the user pool, unless they already have a
 * session there; the pool sets its cookie. Throws a message to show if it
 * can't (the pool limits new guests per address).
 */
export async function ensureGuest(): Promise<void> {
  const pool = useUserPool();
  if ((await pool.getSession()).data) return;
  const made = await pool.signIn.anonymous();
  if (made.error) {
    throw {
      data: {
        message:
          made.error.status === 429
            ? "Too many new players from here; try again soon"
            : "Could not save your result",
      },
    };
  }
}
