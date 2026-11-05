// Spotcraft's management API (its decision 39): oRPC procedures at `/v1/rpc`,
// each a POST of `{ json: input }` answering `{ json: output }`. Plain fetch,
// with no dependencies, so the bin/ scripts can run it with Node directly.
// Swap it for @spotcraft/sdk's `manage` once the SDK is published.

/** Spotcraft refusing a call: its code (`CONFLICT`, `INVALID`, …), status and details. */
export class SpotcraftRpcError extends Error {
  code: string;
  status: number;
  data: unknown;

  constructor(message: string, code: string, status: number, data: unknown) {
    super(message);
    this.name = "SpotcraftRpcError";
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

/**
 * Who's calling: Sokobanko's own key (`sc_…`, Spotcraft's decision 50), sent
 * as `X-Spotcraft-Key`; a secret (the admin secret, or a session token), sent
 * as `Authorization: Bearer`; or the key together with a player's session
 * token, for that player's records (decision 62). Keys are for servers only.
 */
export type Credentials =
  | { key: string }
  | { secret: string }
  | { key: string; token: string };

export function credentialHeaders(
  credentials: Credentials,
): Record<string, string> {
  if ("token" in credentials) {
    return {
      "x-spotcraft-key": credentials.key,
      authorization: `Bearer ${credentials.token}`,
    };
  }
  return "key" in credentials
    ? { "x-spotcraft-key": credentials.key }
    : { authorization: `Bearer ${credentials.secret}` };
}

/** Calls one procedure, such as `data.put`, as whoever `credentials` belong to. */
export async function rpc<T>(
  url: string,
  credentials: Credentials,
  procedure: string,
  input: unknown,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const response = await fetcher(
    `${url.replace(/\/+$/, "")}/v1/rpc/${procedure.replaceAll(".", "/")}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...credentialHeaders(credentials),
      },
      body: JSON.stringify({ json: input }),
    },
  );
  const body = (await response.json().catch(() => null)) as {
    json?: unknown;
  } | null;
  if (!response.ok) {
    const error = (body?.json ?? {}) as {
      code?: string;
      message?: string;
      data?: unknown;
    };
    throw new SpotcraftRpcError(
      error.message ?? `Spotcraft answered ${response.status}`,
      error.code ?? "UNKNOWN",
      response.status,
      error.data,
    );
  }
  return body?.json as T;
}
