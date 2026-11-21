/**
 * The self-hosting stack's smoke test (self-host/, docs/Self-Hosting.md):
 * Sokobanko running without Spotcraft, end to end. Against a migrated stack:
 *
 *   pnpm self-host && pnpm self-host:smoke
 *
 * A new guest saves a solve of the first level, finds it in both exports, then
 * deletes themselves, which deletes the result too. Postgres is checked with
 * psql in its container. BASE_URL is http://localhost:8080 by default.
 */

import { deepStrictEqual, equal, ok } from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:8080";
const compose = new URL("../self-host/compose.yaml", import.meta.url).pathname;
const facts: unknown = JSON.parse(
  readFileSync(
    new URL("../self-host/legal-facts.json", import.meta.url),
    "utf8",
  ),
);
const solutions: Record<string, string> = JSON.parse(
  readFileSync(
    new URL("../server/utils/solutions.json", import.meta.url),
    "utf8",
  ),
);

/** The guest's cookies, as a browser keeps them for this origin. */
const jar = new Map<string, string>();

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  // As from a page on the site: the pool checks the origin of every POST.
  headers.set("origin", base);
  if (jar.size > 0) {
    headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
  }
  const response = await fetch(new URL(path, base), { ...init, headers });
  for (const cookie of response.headers.getSetCookie()) {
    const [pair = "", ...attributes] = cookie.split(";");
    const at = pair.indexOf("=");
    const name = pair.slice(0, at).trim();
    const value = pair.slice(at + 1).trim();
    const expired = attributes.some((a) => /^\s*max-age=0\s*$/i.test(a));
    if (expired || value === "") jar.delete(name);
    else jar.set(name, value);
  }
  return response;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await call(path, init);
  const body = await response.text();
  ok(response.ok, `${path}: ${response.status} ${body.slice(0, 300)}`);
  return JSON.parse(body) as T;
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

/** One value from Postgres, as the superuser in its container. */
function sql(query: string): string {
  return execFileSync(
    "docker",
    [
      ...["compose", "-f", compose, "exec", "-T", "postgres"],
      ...[
        "psql",
        "-U",
        "postgres",
        "-d",
        "apps",
        "-tAX",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      ...["-c", query],
    ],
    { encoding: "utf8" },
  ).trim();
}

async function step(name: string, run: () => Promise<void>) {
  try {
    await run();
    console.info(`ok   ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await step("the app is healthy", async () => {
  equal((await call("/api/health")).status, 200);
});

await step("/api/legal and /_spotcraft/legal.json are the facts", async () => {
  deepStrictEqual(await json("/api/legal"), facts);
  deepStrictEqual(await json("/_spotcraft/legal.json"), facts);
});

for (const page of ["/privacy", "/legal"]) {
  await step(`${page} names the owner`, async () => {
    const response = await call(page);
    equal(response.status, 200);
    const html = await response.text();
    ok(html.includes("Ana Example"), `${page} doesn't name Ana Example`);
    ok(html.includes("privacy@example.test"), `${page} has no contact`);
  });
}

let guest = "";
await step("a guest signs in", async () => {
  const made = await json<{ user: { id: string; isAnonymous: boolean } }>(
    "/_spotcraft/auth/sign-in/anonymous",
    post({}),
  );
  ok(made.user.isAnonymous);
  guest = made.user.id;
  ok(jar.size > 0, "no session cookie");
});

const [first] = await json<{ id: string }[]>("/api/levels");
ok(first, "no levels: run the migrations");
const log = solutions[first.id];
ok(log, `no known solution for ${first.id}`);

await step(`the guest solves ${first.id}`, async () => {
  const solved = await json<{ moves: number }>(
    `/api/levels/${first.id}/complete`,
    post({ log }),
  );
  ok(solved.moves > 0);
  equal(
    sql(
      `SELECT count(*) FROM app_sokobanko.progress WHERE user_id = '${guest}'`,
    ),
    "1",
  );
});

await step("both exports hold it", async () => {
  const mine = await json<{
    guest: { id: string } | null;
    results: { level: string }[];
  }>("/api/me/export");
  equal(mine.guest?.id, guest);
  deepStrictEqual(
    mine.results.map((r) => r.level),
    [first.id],
  );
  const pool = await json<{ user: { id: string }; sessions: unknown[] }>(
    "/_spotcraft/auth/export",
  );
  equal(pool.user.id, guest);
  equal(pool.sessions.length, 1);
});

await step("the guest deletes themselves", async () => {
  const cookies = new Map(jar);
  await json("/_spotcraft/auth/delete-anonymous-user", post({}));
  // The old cookie, as if the browser had kept it: the pool no longer knows it.
  for (const [name, value] of cookies) jar.set(name, value);
  const session = await call("/_spotcraft/auth/get-session");
  equal(session.status, 200);
  equal(await session.json(), null, "the session is still there");
  equal(sql(`SELECT count(*) FROM auth.users WHERE id = '${guest}'`), "0");
  equal(
    sql(
      `SELECT count(*) FROM app_sokobanko.progress WHERE user_id = '${guest}'`,
    ),
    "0",
    "the result outlived the guest",
  );
});

console.info("Smoke test passed");
