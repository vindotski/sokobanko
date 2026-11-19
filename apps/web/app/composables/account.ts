import { createAuthClient } from "better-auth/client";
import { anonymousClient } from "better-auth/client/plugins";

/**
 * The visitor's guest, or null until they've saved something: the browser
 * makes one in Spotcraft's user pool before the first save (useUserPool), and
 * the pool keeps it in an HttpOnly cookie the browser can't read. Refresh it
 * after saving.
 */
export const useAccount = () =>
  useFetch("/api/me", {
    key: "account",
    transform: (me) => me.guest,
  });

/**
 * `$fetch` for Sokobanko's own API. During a server render it forwards the
 * browser's cookies, so the server knows who's asking; in the browser, they're
 * sent with the request anyway.
 */
export const useApi = () => useRequestFetch();

let pool: ReturnType<typeof makePool> | undefined;

const makePool = (baseURL: string) =>
  createAuthClient({ baseURL, plugins: [anonymousClient()] });

/**
 * Spotcraft's user pool, from the browser: on Spotcraft it answers at
 * /_spotcraft/auth on the app's own domain, so its session cookie is
 * first-party. Locally it runs on its own port (AUTH_URL in .env), and
 * `localhost` cookies reach every port. Browser only.
 */
export function useUserPool() {
  const configured = useRuntimeConfig().public.authUrl;
  pool ??= makePool(
    configured || new URL("/_spotcraft/auth", location.origin).href,
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
