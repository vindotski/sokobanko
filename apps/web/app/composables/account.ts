/**
 * The visitor's guest, or null until they've saved something: the server
 * makes one on their first save (server/middleware/guest.ts), and keeps it in
 * an HttpOnly cookie the browser can't read. Refresh it after saving.
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
