import { describe, expect, it, vi } from "vitest";
import { rpc, SpotcraftRpcError } from "./rpc";

const answer = (status: number, json: unknown) =>
  vi.fn(async () => new Response(JSON.stringify({ json }), { status }));

describe("rpc", () => {
  it("POSTs the input as { json } with the secret, and answers the output", async () => {
    const fetcher = answer(200, [{ name: "main", commit: "abc" }]);
    const refs = await rpc(
      "https://api.vin.ski/",
      { secret: "secret" },
      "refs.list",
      { project: "sokobanko" },
      fetcher,
    );
    expect(refs).toEqual([{ name: "main", commit: "abc" }]);
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.vin.ski/v1/rpc/refs/list");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe(
      "Bearer secret",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      json: { project: "sokobanko" },
    });
  });

  it("sends a key as X-Spotcraft-Key, and no Authorization", async () => {
    const fetcher = answer(200, []);
    await rpc(
      "https://api.vin.ski",
      { key: "sc_abc_secret" },
      "refs.list",
      { project: "sokobanko" },
      fetcher,
    );
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["x-spotcraft-key"]).toBe("sc_abc_secret");
    expect(headers.authorization).toBeUndefined();
  });

  it("throws Spotcraft's code, status and details", async () => {
    const fetcher = answer(409, {
      defined: false,
      code: "CONFLICT",
      status: 409,
      message: "main moved",
      data: { current: "def" },
    });
    const call = rpc(
      "https://api.vin.ski",
      { secret: "secret" },
      "files.save",
      {},
      fetcher,
    );
    await expect(call).rejects.toBeInstanceOf(SpotcraftRpcError);
    await expect(
      rpc(
        "https://api.vin.ski",
        { secret: "secret" },
        "files.save",
        {},
        fetcher,
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      data: { current: "def" },
    });
  });

  it("copes with an answer that isn't Spotcraft's", async () => {
    const fetcher = vi.fn(
      async () => new Response("Bad gateway", { status: 502 }),
    );
    await expect(
      rpc(
        "https://api.vin.ski",
        { secret: "secret" },
        "refs.list",
        {},
        fetcher,
      ),
    ).rejects.toMatchObject({ code: "UNKNOWN", status: 502 });
  });
});
