# Signing in with Spotcraft instead of Supabase Auth

How to move Sokobanko's accounts from Supabase Auth to the Spotcraft API at https://api.vin.ski. Written against Spotcraft's `main` with ADRs 45 and 47: accounts, bearer tokens, CORS and anonymous guests.

**What changes:**

| | Now | After |
| --- | --- | --- |
| Who signs in | Supabase Auth, guests via `signInAnonymously` | Spotcraft: a guest via `POST /v1/auth/sign-in/anonymous` |
| Where the session lives | Supabase's client (cookies via `@nuxtjs/supabase`) | A Spotcraft token in `localStorage`, sent as `Authorization: Bearer` |
| Who the server trusts | `serverSupabaseUser(event)` | `requireUser(event)`: asks Spotcraft's `/v1/auth/get-session` with the token |
| Levels | Spotcraft (`server/utils/levels.ts`) | Unchanged |
| Completions | Supabase, `user_id` → `auth.users`, read by the browser through RLS | Still Supabase until Spotcraft has app data, but keyed by the **Spotcraft user id**, and read and written **only by Sokobanko's server** (service role) |

Supabase stays only as the completions database; its auth isn't used.

## 1. On the Spotcraft side

Trust Sokobanko's origins, so browsers may call the API (as `deploy`, in `/srv/spotcraft`; Spotcraft's DEPLOY.md, "Adding a product"):

```bash
# add both, comma-separated, to the existing list in .env:
AUTH_TRUSTED_ORIGINS=https://dash.vin.ski,http://localhost:5173,https://sokobanko.vin.ski,http://localhost:3000
docker compose up -d api
```

`http://localhost:3000` is `nuxt dev`, for development against api.vin.ski. Leave it out if you'd rather develop against a local Spotcraft (`pnpm dev` in Spotcraft, and `NUXT_PUBLIC_SPOTCRAFT_URL=http://localhost:3003`).

Check from a laptop that the preflight answers `204 https://sokobanko.vin.ski`:

```bash
curl -s -o /dev/null -w "%{http_code} %header{access-control-allow-origin}\n" -X OPTIONS \
  -H 'origin: https://sokobanko.vin.ski' -H 'access-control-request-method: POST' \
  https://api.vin.ski/v1/auth/sign-in/anonymous
```

**Why not the SDK yet:** `@spotcraft/sdk` isn't on npm (SPOTCRAFT_SUGGESTIONS.md, 1). Below, a small client does what its token mode does, with plain `fetch`. Swap it for `createClient({ url, auth: "token" })` once the SDK is published; the method names match.

## 2. The Spotcraft URL, for the browser too

`nuxt.config.ts` keeps `spotcraftUrl` for the server, and adds a public copy:

```ts
runtimeConfig: {
  spotcraftUrl: "https://api.vin.ski",
  public: {
    // The browser signs in against it (app/lib/spotcraft-auth.ts).
    // NUXT_PUBLIC_SPOTCRAFT_URL overrides it.
    spotcraftUrl: "https://api.vin.ski",
  },
},
```

## 3. The client: `app/lib/spotcraft-auth.ts`

```ts
// Accounts on Spotcraft (its ADR 47): a session token kept in localStorage and sent as
// `Authorization: Bearer`, as @spotcraft/sdk's token mode does. Replace with the SDK once it's
// published: createClient({ url, auth: "token" }) has the same methods.

export type Account = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "user";
  isAnonymous: boolean;
};

const KEY = "sokobanko:spotcraft-token";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(token: string | null) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {}
}

export function createSpotcraftAuth(baseUrl: string) {
  async function call<T>(path: string, body?: unknown): Promise<T> {
    const token = read();
    const response = await fetch(`${baseUrl}/v1/auth${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const fresh = response.headers.get("set-auth-token");
    if (fresh) write(fresh);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw Object.assign(new Error(data?.message ?? `Spotcraft answered ${response.status}`), {
        status: response.status,
        code: data?.code,
      });
    }
    return data as T;
  }

  return {
    /** The token, for calls to Sokobanko's own server. */
    token: read,
    session: async () => (await call<{ user: Account } | null>("/get-session"))?.user ?? null,
    signInAnonymously: async () => (await call<{ user: Account }>("/sign-in/anonymous", {})).user,
    signIn: async (input: { email: string; password: string }) =>
      (await call<{ user: Account }>("/sign-in/email", input)).user,
    signOut: async () => {
      try {
        await call("/sign-out", {});
      } finally {
        write(null);
      }
    },
    /** Forgets a token that no longer works (its account was deleted, or the database reset). */
    forget: () => write(null),
  };
}
```

## 4. Every visitor a guest: replace `app/plugins/anonymous-auth.client.ts`

It keeps today's behavior: client-only, not awaited, and a dead session starts over as a new guest. The account goes in Nuxt state, where `useSupabaseUser()` used to be.

```ts
import { type Account, createSpotcraftAuth } from "~/lib/spotcraft-auth";

// Every visitor gets a session so progress can be saved before signing up.
// Runs only in the browser, so server renders and crawlers don't create users.
export default defineNuxtPlugin(() => {
  const auth = createSpotcraftAuth(useRuntimeConfig().public.spotcraftUrl);
  const account = useAccount();

  const startAsGuest = () =>
    auth
      .signInAnonymously()
      .then((guest) => (account.value = guest))
      .catch((error) => console.error("Anonymous sign-in failed:", error.message));

  // A stored token whose session is gone (expired, signed out elsewhere, account deleted)
  // answers null: start over as a new guest. Being offline keeps the token.
  if (!auth.token()) startAsGuest();
  else
    auth
      .session()
      .then((current) => {
        if (current) account.value = current;
        else {
          auth.forget();
          return startAsGuest();
        }
      })
      .catch((error) => console.error("Session check failed:", error.message));

  return { provide: { spotcraftAuth: auth } };
});
```

And `app/composables/account.ts`, the replacement for `useSupabaseUser()`:

```ts
import type { Account } from "~/lib/spotcraft-auth";

/** The signed-in account (a guest at first), or null until the plugin has one. */
export const useAccount = () => useState<Account | null>("account", () => null);

/** `$fetch` to Sokobanko's own server, with the Spotcraft token, so it knows who's asking. */
export function useApi() {
  const { $spotcraftAuth } = useNuxtApp();
  return $fetch.create({
    onRequest({ options }) {
      const token = $spotcraftAuth?.token();
      if (token) options.headers.set("authorization", `Bearer ${token}`);
    },
  });
}
```

**Where `useSupabaseUser()` is used** (`PlayButton.vue`, `SiteHeader.vue`, `levels/index.vue`, `play/[id].vue`, `profile.vue`, `stores/progress.ts`, `composables/levels.ts`), switch to `useAccount()`. The fields map like this:

| Supabase | Spotcraft |
| --- | --- |
| `user.value.sub` / `id` | `account.value.id` (a string, not a uuid) |
| `user.value.is_anonymous` | `account.value.isAnonymous` |
| `user.value.email` | `account.value.email` (a guest has a placeholder: `temp-…@api.vin.ski`, so show "Guest" when `isAnonymous`) |

## 5. The server trusts Spotcraft's answer: `server/utils/user.ts`

```ts
/**
 * The account behind the request's `Authorization: Bearer <token>`, as Spotcraft says, or a 401.
 * Spotcraft checks the token; we only ask. The answer is the source of truth for the user id.
 */
export async function requireUser(event: H3Event) {
  const authorization = getHeader(event, "authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, message: "No session" });
  }
  const { spotcraftUrl } = useRuntimeConfig();
  const session = await $fetch<{ user: { id: string; isAnonymous: boolean } } | null>(
    "/v1/auth/get-session",
    { baseURL: spotcraftUrl, headers: { authorization } },
  ).catch(() => null);
  if (!session) throw createError({ statusCode: 401, message: "Session expired" });
  return session.user;
}
```

It's server-to-server, so CORS doesn't apply. Each check is one request to Spotcraft. If that ever matters, cache by token for a minute with `defineCachedFunction`.

## 6. Completions: written and read only by the server

**The migration.** The rows keep their shape, but `user_id` becomes Spotcraft's id (text), with no foreign key to Supabase's `auth.users`. The browser no longer reads the table, so its RLS policy and grant go. Run `supabase migration new completions_for_spotcraft_users`, then:

```sql
-- Completions belong to Spotcraft accounts (its ADR 47), not Supabase's: the server, which
-- checks the Spotcraft token first, is the only one reading and writing them.

-- The old rows belong to Supabase guests no one can sign in as anymore.
truncate public.level_completions;

drop policy "Users can view their own completions" on public.level_completions;
revoke select on public.level_completions from authenticated;

alter table public.level_completions drop constraint level_completions_user_id_fkey;
alter table public.level_completions alter column user_id type text;
alter table public.level_completions
  add constraint level_completions_user_id_format check (user_id ~ '^[A-Za-z0-9_-]{1,64}$');

-- The same function, taking a Spotcraft id.
drop function public.record_level_completion(uuid, text, text);
create function public.record_level_completion(p_user_id text, p_level_id text, p_solution text)
returns public.level_completions
language sql
security invoker
set search_path = ''
as $$
  -- (the same body as before)
$$;
revoke execute on function public.record_level_completion(text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_level_completion(text, text, text) to service_role;
```

Keeping old progress instead: it belongs to Supabase guests with no Spotcraft account, so there's no one to give it to. Truncating is right for a demo.

**`server/api/levels/[id]/complete.post.ts`:**
- `const user = await requireUser(event);` replaces `serverSupabaseUser(event)`.
- The "which levels are solved" read uses the service role, filtered by user, since RLS no longer applies:

  ```ts
  const supabase = serverSupabaseServiceRole(event);
  const done = await supabase.from("level_completions").select("level_id").eq("user_id", user.id);
  ```
- `p_user_id: user.id` in the `rpc` call.
- The `23503` check goes: there's no foreign key now, and `requireUser` already turns a dead session into 401.

**A new read route, `server/api/me/completions.get.ts`,** for `useCompletions()` and the progress store:

```ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { data, error } = await serverSupabaseServiceRole(event)
    .from("level_completions")
    .select("level_id, moves, pushes, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});
```

**In the app:**
- `useCompletions()` and `useProgressStore().load()` call `useApi()("/api/me/completions")` instead of `supabase.from(...)`, and watch `useAccount().value?.id` instead of `user.value?.sub`.
- `play/[id].vue` posts the solution with `useApi()(`/api/levels/${levelId}/complete`, …)`, so the token goes along.

## 7. Removing Supabase Auth

- **`nuxt.config.ts`:** drop the `@nuxtjs/supabase` module once nothing uses `useSupabaseClient`, `useSupabaseUser` or `serverSupabaseUser`. The server still needs a Supabase client for completions: create one in `server/utils/supabase.ts` with `createClient(url, serviceRoleKey)` from `@supabase/supabase-js`, and use it where `serverSupabaseServiceRole(event)` was.
- **`supabase/config.toml`:** anonymous sign-ins can be turned off.
- **`profiles`** references `auth.users`. If nothing reads it, drop it in the same migration; if something does, key it by Spotcraft id like completions.
- **The FAQ** ("You get a guest account automatically…") stays true.

## 8. Signing up later ("keep your progress")

Spotcraft turns a guest into a real account when the guest signs up **while still sending the guest's token**. The guest is then deleted, and the account gets a **new id**. Completions are keyed by the guest's id, so they have to move to the new one. Sokobanko's server does it, in one route:

```ts
// server/api/me/sign-up.post.ts
export default defineEventHandler(async (event) => {
  const guest = await requireUser(event); // the guest's token, still valid
  const body = await readBody<{ name: string; email: string; password: string }>(event);
  const { spotcraftUrl } = useRuntimeConfig();
  const response = await $fetch.raw<{ user: { id: string } }>("/v1/auth/sign-up/email", {
    baseURL: spotcraftUrl,
    method: "POST",
    headers: { authorization: getHeader(event, "authorization")! },
    body,
  });
  const account = response._data!.user;
  if (guest.isAnonymous) {
    await serverSupabaseServiceRole(event)
      .from("level_completions")
      .update({ user_id: account.id })
      .eq("user_id", guest.id);
  }
  // The client stores this and drops the guest's token.
  return { token: response.headers.get("set-auth-token"), user: account };
});
```

Signing **in** to an existing account while a guest works the same way, except both may have solved the same level. Keep the better result per level (fewer moves) before moving the rest.

## 9. Checking it

- **Locally,** with Spotcraft's `pnpm dev` (its API on `:3003`, `http://localhost:3000` in its `AUTH_TRUSTED_ORIGINS`) and `NUXT_PUBLIC_SPOTCRAFT_URL=http://localhost:3003 pnpm dev` here:
  1. a first visit shows "Guest", and `localStorage` has `sokobanko:spotcraft-token`;
  2. solving a level saves it, and a reload keeps the session and the completion;
  3. in Spotcraft's dashboard, **Users** says "And 1 guest";
  4. deleting that guest in Spotcraft's database, then reloading, starts a new guest with no completions, and no error.
- **Live:** the same on https://sokobanko.vin.ski, after section 1's origins are added.
- **Tests (vitest):** `requireUser` with a mocked `$fetch`: no header gives 401, `null` from Spotcraft gives 401, and a user is returned. The complete route rejects a missing token.
