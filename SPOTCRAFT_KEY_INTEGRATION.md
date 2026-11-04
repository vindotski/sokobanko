# Moving Sokobanko from the admin secret to a product key

Spotcraft now has **products' keys** and **project access** (Spotcraft's decision 50). This guide moves Sokobanko's server from Spotcraft's `ADMIN_SECRET` to a key of its own, then makes the `sokobanko` project private.

**Why it's worth doing:**
- **The admin secret can edit and publish every project on api.vin.ski.** A key reaches only `sokobanko`, with only the scopes it's given, and can be revoked on its own.
- **Players' results are public today.** `progress/<spotcraft-id>.md` sits in the `sokobanko` project, which is `open`, so anyone can read every player's results at `https://api.vin.ski/v1/projects/sokobanko/content/progress/`. Once the project is `private`, only Sokobanko's server can read them.

Nothing here changes how players sign in. The browser's guest sign-in (`app/lib/spotcraft-auth.ts`) keeps working as it is. Moving sign-in to the server is a later Spotcraft step, with its own guide.

## What Spotcraft changed

- **A key looks like `sc_<id>_<secret>`.** It's sent in its own header, **`X-Spotcraft-Key`**, never in `Authorization`, and only from a server. `Authorization` keeps carrying a player's session token, or the admin secret.
- **What a key can do:** it reaches the projects it lists, with its scopes.
  - `files:read`: reading content (delivery) and management's reads (`files.read`, `files.list`, `refs.list`, …).
  - `files:write`: saving to drafts, and creating and deleting branches.
  - `files:publish`: saving or merging into a protected branch. `main` is protected, and Sokobanko saves results straight onto `main`, so it needs this.
- **Who may read a project** is `open`, `private` or `restricted`.
  - `sokobanko` is **`open`** today, set when keys arrived so nothing would break.
  - `private` needs a key, an editor, or the admin secret.
  - `restricted` lets a key read only beside a signed-in player who isn't a guest. That would lock guests out of the levels, so **Sokobanko should be `private`, not `restricted`.**
- **A bad key is refused, never ignored.** A key that's malformed, unknown, revoked or wrong gets a `401` everywhere, `/v1/auth/get-session` included.
- **Commits made with a key** carry the key's name as their author, `sokobanko`. That's no longer "Spotcraft admin".

## Steps

### 1. Check that keys are live on api.vin.ski

Keys exist once Spotcraft's six commits for decision 50 are deployed. This request answers `401` once they are, and `200` before:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "x-spotcraft-key: nope" https://api.vin.ski/v1/auth/get-session
```

### 2. Make the key (in the Spotcraft repository)

From `../spotcraft`, with the admin secret in the environment:

```bash
export SPOTCRAFT_API_URL=https://api.vin.ski
read -rs SPOTCRAFT_ADMIN_SECRET && export SPOTCRAFT_ADMIN_SECRET   # paste it, then Enter
node --conditions=source packages/spotcraft/src/index.ts keys create sokobanko \
  --projects sokobanko --scopes files:read,files:write,files:publish
```

- **It prints the key once.** Put it straight into your password manager. Spotcraft keeps only its hash.
- **`files:write` and `files:publish`** are for saving results on `main`. A product that only read levels would need just `files:read`.
- **`keys list`** shows the key's id, its scopes and when it was last used. Never the key itself.

### 3. The code changes in Sokobanko

**Settings,** in `apps/web/nuxt.config.ts`: add `spotcraftKey` beside `spotcraftAdminSecret`. The admin secret is removed in step 6.

```ts
runtimeConfig: {
  spotcraftUrl: "https://api.vin.ski",
  // Sokobanko's own key for Spotcraft (its decision 50): levels, and saving
  // players' results. Server-only; NUXT_SPOTCRAFT_KEY.
  spotcraftKey: "",
  spotcraftAdminSecret: "",
  // …
},
```

`apps/web/.env.example`:

```bash
# Sokobanko's Spotcraft key (sc_…), for levels and saving results (server-only; never commit it).
NUXT_SPOTCRAFT_KEY=
```

**The management client,** `apps/web/server/spotcraft/rpc.ts`. It takes the credential to send, a key or a secret, instead of a bare secret:

```ts
/** Who's calling: Sokobanko's key, or a secret (the admin secret, a session token). */
export type Credentials = { key: string } | { secret: string };

export function credentialHeaders(credentials: Credentials): Record<string, string> {
  return "key" in credentials
    ? { "x-spotcraft-key": credentials.key }
    : { authorization: `Bearer ${credentials.secret}` };
}

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
      headers: { "content-type": "application/json", ...credentialHeaders(credentials) },
      body: JSON.stringify({ json: input }),
    },
  );
  // … the rest stays as it is
}
```

Update `rpc.test.ts`: the call with `{ key }` sends `x-spotcraft-key` and no `authorization`, and `{ secret }` sends `authorization: Bearer …` as before.

**Saving results,** `apps/web/server/utils/progress.ts`: use the key, falling back to the admin secret until step 6.

```ts
const { spotcraftUrl, spotcraftKey, spotcraftAdminSecret } = useRuntimeConfig();
const credentials = spotcraftKey
  ? { key: spotcraftKey }
  : spotcraftAdminSecret
    ? { secret: spotcraftAdminSecret }
    : null;
if (!credentials) {
  // the same "can't save results" error as today
}
const call = <T>(procedure: string, input: unknown) =>
  rpc<T>(spotcraftUrl, credentials, procedure, input);
```

**Reading levels,** `apps/web/server/utils/levels.ts`. This read works without a key today, but stops working once the project is private:

```ts
const { spotcraftUrl, spotcraftKey } = useRuntimeConfig();
const { items } = await $fetch<{ items: ContentItem[] }>(
  "/v1/projects/sokobanko/content/levels/",
  {
    baseURL: spotcraftUrl,
    headers: spotcraftKey ? { "x-spotcraft-key": spotcraftKey } : {},
  },
);
```

**Checking a session,** `apps/web/server/utils/user.ts`: no change is needed. `/v1/auth/get-session` doesn't need a key.
- **If you add the key here later,** remember that a wrong key makes `get-session` a `401`. `requireUser` turns any failure into a `503` ("Spotcraft unavailable"), so a bad key would look like an outage.
- **Never send the key from the browser.** `app/lib/spotcraft-auth.ts` and anything under `app/` stay without it.

**The levels scripts,** `bin/levels-content.ts`, can keep the admin secret, since they're the maintainer's tools, run by hand. Or they can take the key too: read `SPOTCRAFT_KEY` first, and pass `{ key }` or `{ secret }` to `rpc` as above. With the key, the import's commits are authored as `sokobanko`.

### 4. Deploy with the key (Vercel)

1. **Add `NUXT_SPOTCRAFT_KEY`** in Vercel (Production, Sensitive), and in `apps/web/.env` locally.
2. **Deploy.**
3. **Check:**
   - solve a level: the result saves;
   - `/levels` and the profile show it;
   - `/play` redirects to the next unsolved level.
4. **Check the key was used:** from `../spotcraft`, `keys list` should show it as last used just now.
   ```bash
   node --conditions=source packages/spotcraft/src/index.ts keys list
   ```
   The new result's commit, in the dashboard's history for `progress/`, is authored by `sokobanko`, not "Spotcraft admin".

### 5. Make the project private

From `../spotcraft`:

```bash
node --conditions=source packages/spotcraft/src/index.ts access sokobanko private
```

Then check:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.vin.ski/v1/projects/sokobanko/content/levels/     # 401
curl -s -o /dev/null -w "%{http_code}\n" https://api.vin.ski/v1/projects/sokobanko/content/progress/   # 401
```

And in the game: the levels still load, and results still save. The server caches levels for a minute, so wait out the cache before trusting a pass.

**To undo,** run `access sokobanko open`.

### 6. Remove the admin secret

1. **In Vercel,** delete `NUXT_SPOTCRAFT_ADMIN_SECRET`, then redeploy.
2. **In the code,** remove `spotcraftAdminSecret` from `nuxt.config.ts` and `.env.example`, and remove the fallback in `progress.ts`.
3. **In the docs,** update `README.md` and `DEPLOY.md`: they tell you to set `NUXT_SPOTCRAFT_ADMIN_SECRET`.
4. **Locally,** remove it from `apps/web/.env`. Keep it in the password manager for the levels scripts, if they still use it.
5. **In `SPOTCRAFT_SUGGESTIONS.md`,** entry 9 (scoped keys) is done.

## Rotating or revoking the key

- **Rotate:** run `keys create` again, switch `NUXT_SPOTCRAFT_KEY` in Vercel to the new key, deploy, then `keys revoke <old id>`. Two keys can be live at once, so there's no downtime.
- **If the key leaks:** run `keys revoke <id>` at once. Every call with it is refused from then on, so results stop saving, and, if the project is private, levels stop loading, until a new key is deployed.

## What's next on Spotcraft's side

- **Server sign-in:** Sokobanko's server signs players in, up and as guests through the SDK, and keeps the token in an `HttpOnly` cookie. Then `sokobanko-token` no longer has to be readable by page scripts.
- **The API becomes bearer-only:** CORS goes, so the browser's direct calls to Spotcraft stop working. A migration guide comes before that.
- **App data:** players' results move out of `progress/` content into private records.
