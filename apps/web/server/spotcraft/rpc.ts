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
 * Calls one procedure, such as `files.save`, as whoever `secret` belongs to
 * (the admin secret, or an editor's session token).
 */
export async function rpc<T>(
  url: string,
  secret: string,
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
        authorization: `Bearer ${secret}`,
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
