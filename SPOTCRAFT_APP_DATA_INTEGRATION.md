# Moving Sokobanko's results to Spotcraft's app data

Spotcraft now keeps content as **versions** of a project, with one draft (Spotcraft's decision 61), and products' own data as **records** (decision 62). This guide moves players' results out of content (`progress/<id>.md`, saved straight onto `main`) into records, and the level scripts off branches.

**Why it's worth doing:**
- **Each result was a commit of the whole project.** With versions, it would be a published version of the whole project. Records are written on their own, one per player and level.
- **No more retries around `main`.** Every player's save moved `main`, so saves retried whenever another player's landed first. A record changes only when that player's best for that level does, with a compare-and-swap on it alone.
- **Results stop being content:** no `progress/_schema.yaml`, no `files:publish` for players' saves, and nothing in the project's history.

**When:** this goes out right after Spotcraft's reset ([its DEPLOY.md](../spotcraft/DEPLOY.md), "Content as versions, and app data: the reset"). Have it ready on a branch first. From the reset's step 7 until this is deployed, completing a level fails and results don't show; the reset converts existing results into records (its step 11), so nothing is lost.

## What Spotcraft changed

- **No branches:** `refs.*` and `files.save` are gone. The published files are read with `files.list` and `files.read` (no `ref`), and changed with **`files.publish`**: changes checked and published as the next version, with `expect`, the published version they were made against (a compare-and-swap; `CONFLICT` if it moved).
- **Records:** `data.get`, `data.list`, `data.put` and `data.delete` (oRPC, at `/v1/rpc/data/…`), with a key holding **`data:read`** and **`data:write`** on `sokobanko`.
  - **The owner is the player whose session token comes with the key** (`X-Spotcraft-Key` plus `Authorization: Bearer <token>`), guests included. Without a token, a record is Sokobanko's own. A key can't name another owner.
  - A record is `{ collection, key, owner, value, version, createdAt, updatedAt }`. `value` is any JSON up to 64 KB; `version` goes up on every write.
  - `data.put` with `version` is a compare-and-swap: `0` only creates, `n` only replaces version `n`; otherwise `CONFLICT` with the current `version`.
  - `data.list` answers `{ records, next }`, by key, up to 100 a page; pass `next` as `after` for the next page.
- **A guest who signs up, or signs in, keeps their records:** Spotcraft moves them to the account. On the same level, the account's own record wins, even when the guest's was better: a guest who beats their account's best and then signs in loses that run. If players notice, Sokobanko can keep the better of the two itself, by reading both before signing in.
- **Each result is one record:** collection `progress`, key the level's id, value `{ moves, pushes, completedAt }`. The reset writes existing results in exactly this shape.

## Steps

### 1. The new key (after Spotcraft's reset)

Spotcraft can't change a key's scopes, so Sokobanko gets a new one. In the Spotcraft repository, with `SPOTCRAFT_API_URL=https://api.vin.ski` and `SPOTCRAFT_ADMIN_SECRET` set:

```bash
node --conditions=source packages/spotcraft/src/index.ts keys create sokobanko \
  --projects sokobanko --scopes files:read,files:publish,data:read,data:write
```

It prints the key once: it goes in `NUXT_SPOTCRAFT_KEY` (the server) and `SPOTCRAFT_KEY` (the level scripts). `files:write` isn't needed any more: Sokobanko never edits the draft.

### 2. `apps/web/server/spotcraft/rpc.ts`: a key and a player's token together

A call for a player's records sends both:

```ts
export type Credentials =
  | { key: string }
  | { secret: string }
  | { key: string; token: string };

export function credentialHeaders(credentials: Credentials): Record<string, string> {
  if ("token" in credentials) {
    return { "x-spotcraft-key": credentials.key, authorization: `Bearer ${credentials.token}` };
  }
  return "key" in credentials
    ? { "x-spotcraft-key": credentials.key }
    : { authorization: `Bearer ${credentials.secret}` };
}
```

### 3. `apps/web/server/utils/user.ts`: the player's token

`requireUser` already reads the token; export that part, so routes can pass it on:

```ts
/** The player's Spotcraft session token: `Authorization: Bearer …`, or the session cookie. */
export function sessionToken(event: H3Event): string | undefined {
  const bearer = getHeader(event, "authorization")?.match(/^Bearer (.+)$/)?.[1];
  return bearer ?? getCookie(event, SESSION_COOKIE);
}
```

and use it at the top of `requireUser` (`const token = sessionToken(event);`).

### 4. `apps/web/server/utils/progress.ts`: results as records

Replace `readProgress` and `recordBest`. Both take the player's token instead of their id: the token says whose records they are.

```ts
import type { Completion } from "../spotcraft/progress";
import { completionsFrom } from "../spotcraft/progress";
import { rpc, SpotcraftRpcError } from "../spotcraft/rpc";

const PROJECT = "sokobanko";
const COLLECTION = "progress";

type Best = { moves: number; pushes: number; completedAt: string };
type Stored = { key: string; value: Best; version: number };

function call<T>(token: string, procedure: string, input: unknown): Promise<T> {
  const { spotcraftUrl, spotcraftKey } = useRuntimeConfig();
  if (!spotcraftKey) {
    throw createError({ statusCode: 500, message: "Saving results isn't configured" });
  }
  return rpc<T>(spotcraftUrl, { key: spotcraftKey, token }, procedure, input);
}

/** The player's best results, one record per level. None yet is an empty list. */
export async function readProgress(token: string): Promise<Completion[]> {
  const found: unknown[] = [];
  let after: string | undefined;
  do {
    const page = await call<{ records: Stored[]; next: string | null }>(token, "data.list", {
      project: PROJECT,
      collection: COLLECTION,
      limit: 100,
      ...(after ? { after } : {}),
    });
    found.push(...page.records.map((r) => ({ level: r.key, ...r.value })));
    after = page.next ?? undefined;
  } while (after);
  // The same checks as before: malformed entries are dropped.
  return completionsFrom({ completions: found });
}

/**
 * Records a run, already replayed and verified, if it beats the player's best for that level,
 * and answers the best. A compare-and-swap on that one record: if it changed meanwhile (the
 * same player, in another tab), it's read again.
 */
export async function recordBest(token: string, run: Completion): Promise<Completion> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    let current: Stored | null = null;
    try {
      current = await call<Stored>(token, "data.get", {
        project: PROJECT,
        collection: COLLECTION,
        key: run.level,
      });
    } catch (error) {
      if (!(error instanceof SpotcraftRpcError && error.code === "NOT_FOUND")) throw error;
    }
    if (current && current.value.moves <= run.moves) return { level: run.level, ...current.value };
    try {
      await call(token, "data.put", {
        project: PROJECT,
        collection: COLLECTION,
        key: run.level,
        value: { moves: run.moves, pushes: run.pushes, completedAt: run.completedAt },
        version: current?.version ?? 0,
      });
      return run;
    } catch (error) {
      if (error instanceof SpotcraftRpcError && error.code === "CONFLICT") continue;
      throw error;
    }
  }
  throw createError({ statusCode: 503, message: "Spotcraft is busy; try again" });
}
```

`playerPath`, `toMarkdown` and `withBest` in `server/spotcraft/progress.ts` aren't used any more: delete them, and their tests. Keep `Completion` and `completionsFrom`.

### 5. The two routes: pass the token

In `apps/web/server/api/me/completions.get.ts` and `apps/web/server/api/levels/[id]/complete.post.ts`, after `requireUser(event)`:

```ts
const token = sessionToken(event) as string; // requireUser has checked it
const completions = await readProgress(token);      // was readProgress(user.id)
const best = await recordBest(token, { … });         // was recordBest(user.id, { … })
```

### 6. The level scripts: `bin/levels-content.ts`

- **`isManaged`:** only `levels/` (drop the `progress/_schema.yaml` line): results aren't content any more.
- **The client:** no branches. Replace `main`, `list`, `read` and `save` with:

```ts
    /** The published version, which a publish is made against (null: none yet). */
    published: async () =>
      (await call<{ slug: string; publishedVersion: number | null }[]>("projects.list", {}))
        .find((p) => p.slug === PROJECT)?.publishedVersion ?? null,
    list: () => call<{ path: string }[]>("files.list", { project: PROJECT }),
    read: async (path: string) =>
      (await call<{ text: string }>("files.read", { project: PROJECT, path })).text,
    publish: (expect: number | null, message: string, changes: unknown[]) =>
      call<{ version: number }>("files.publish", {
        project: PROJECT,
        expect,
        message,
        changes,
        author: { name: "Sokobanko", email: "levels@sokobanko.vin.ski" },
      }),
```

- **`bin/levels-import.ts`:** `const expect = await api.published();` in place of `api.main()`, then `api.publish(expect, message, changes)` in place of `api.save(base, …)`, and print `published version ${saved.version}`. A `CONFLICT` now means someone published meanwhile: run it again. It no longer has to retry around players' saves.
- **`bin/progress-export.ts`** and its `progress:export` script go: a key reaches one player's records at a time, never everyone's. Spotcraft's nightly backups hold them.
- **`content/progress/`** goes from the repository: it holds real players' results, which now live only in Spotcraft.

### 7. Deploy, then check

1. Deploy with the new key in `NUXT_SPOTCRAFT_KEY`, right after Spotcraft's reset has converted the results.
2. As a player who had results: they show, and a new best is saved (and an unimproved run isn't).
3. As a new guest: complete a level, sign up, and the result is still there.
4. Run `pnpm levels:import`: "no changes", or "published version N".
5. Keep the old key until Spotcraft's reset is settled (its step 16): rolling back means the previous Sokobanko, with the old key. Then revoke it (`keys list`, then `keys revoke <id>`).
