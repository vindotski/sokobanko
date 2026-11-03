import type { Account } from "~/lib/spotcraft-auth";

/** The signed-in Spotcraft account (a guest at first), or null until the plugin has one. */
export const useAccount = () => useState<Account | null>("account", () => null);

/**
 * The Spotcraft session token, in a cookie so that Sokobanko's server sees it
 * too (server/utils/user.ts). 400 days, the longest browsers allow, so guests
 * don't lose their progress.
 */
export const useSessionToken = () =>
  useCookie<string | null>("sokobanko-token", {
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    secure: !import.meta.dev,
    default: () => null,
  });

/**
 * `$fetch` for Sokobanko's own API. During a server render it forwards the
 * browser's cookies, so the server knows who's asking; in the browser, they're
 * sent with the request anyway.
 */
export const useApi = () => useRequestFetch();
