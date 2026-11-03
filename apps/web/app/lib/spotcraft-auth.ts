import type { Ref } from "vue";

// Accounts on Spotcraft (its decisions 45 and 47): a session token sent as
// `Authorization: Bearer`, as @spotcraft/sdk's token mode does. Unlike the
// SDK, the token lives in a cookie rather than localStorage, so Sokobanko's
// own server sees it too and renders pages with the player's progress.
// Replace with the SDK once it's published: createClient({ url, auth: "token" })
// has the same methods.

/** A Spotcraft account, as `/v1/auth/get-session` returns it. */
export interface Account {
  id: string;
  name: string;
  /** A guest has a placeholder address (`temp-…@api.vin.ski`). */
  email: string;
  role: "admin" | "editor" | "user";
  isAnonymous: boolean;
}

/** Spotcraft's answer when it refuses a call. */
export class SpotcraftAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "SpotcraftAuthError";
  }
}

/** `token` holds the session token (the `sokobanko-token` cookie). */
export function createSpotcraftAuth(
  baseUrl: string,
  token: Ref<string | null | undefined>,
) {
  async function call<T>(path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (token.value) headers.authorization = `Bearer ${token.value}`;
    const response = await fetch(`${baseUrl}/v1/auth${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Spotcraft sends a new token when it signs in, or rotates one.
    const fresh = response.headers.get("set-auth-token");
    if (fresh) token.value = fresh;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new SpotcraftAuthError(
        data?.message ?? `Spotcraft answered ${response.status}`,
        response.status,
        data?.code,
      );
    }
    return data as T;
  }

  return {
    /** The account behind the token, or null if Spotcraft no longer knows it. */
    session: async () =>
      (await call<{ user: Account } | null>("/get-session"))?.user ?? null,
    signInAnonymously: async () =>
      (await call<{ user: Account }>("/sign-in/anonymous", {})).user,
    signIn: async (input: { email: string; password: string }) =>
      (await call<{ user: Account }>("/sign-in/email", input)).user,
    signOut: async () => {
      try {
        await call("/sign-out", {});
      } finally {
        token.value = null;
      }
    },
    /** Forgets a token that no longer works (its account was deleted, or the database reset). */
    forget: () => {
      token.value = null;
    },
  };
}
