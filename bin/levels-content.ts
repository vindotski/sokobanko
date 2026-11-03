// What bin/levels-import.ts and bin/levels-export.ts share: which paths in the
// sokobanko project this repository owns, and the management client.
// The project also holds players' results, `progress/<id>.md`, written by
// Sokobanko's server, so these scripts never touch them (unlike
// `spotcraft import`, which deletes every file missing from the folder).

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { rpc } from "../apps/web/server/spotcraft/rpc.ts";

export const PROJECT = "sokobanko";
export const CONTENT = fileURLToPath(new URL("../content/", import.meta.url));

/** The levels and their schema, and the progress schema; never a player's file. */
export function isManaged(path: string): boolean {
  if (path === "progress/_schema.yaml") return true;
  return (
    path.startsWith("levels/") &&
    (path.endsWith(".md") || path.endsWith("/_schema.yaml"))
  );
}

/** The managed files in content/, as project paths with their text. */
export function localFiles(): Map<string, string> {
  const files = new Map<string, string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const path = relative(CONTENT, full).split(sep).join("/");
        if (isManaged(path)) files.set(path, readFileSync(full, "utf8"));
      }
    }
  };
  walk(CONTENT);
  return files;
}

/** The management client, from SPOTCRAFT_API_URL and SPOTCRAFT_ADMIN_SECRET. */
export function client() {
  const url = process.env.SPOTCRAFT_API_URL ?? "https://api.vin.ski";
  const secret = process.env.SPOTCRAFT_ADMIN_SECRET;
  if (!secret) {
    console.error(
      "Set SPOTCRAFT_ADMIN_SECRET (and SPOTCRAFT_API_URL if not https://api.vin.ski).",
    );
    process.exit(1);
  }
  const call = <T>(procedure: string, input: unknown) =>
    rpc<T>(url, secret, procedure, input);
  return {
    url,
    main: async () => {
      const refs = await call<{ name: string; commit: string }[]>("refs.list", {
        project: PROJECT,
      });
      const main = refs.find((r) => r.name === "main");
      if (!main) throw new Error(`${PROJECT} has no main branch`);
      return main.commit;
    },
    list: () =>
      call<{ path: string }[]>("files.list", { project: PROJECT, ref: "main" }),
    read: async (path: string) =>
      (
        await call<{ text: string }>("files.read", {
          project: PROJECT,
          ref: "main",
          path,
        })
      ).text,
    save: (base: string, message: string, changes: unknown[]) =>
      call<{ commit: string; check: { ok: boolean } }>("files.save", {
        project: PROJECT,
        ref: "main",
        base,
        message,
        changes,
        author: { name: "Sokobanko", email: "levels@sokobanko.vin.ski" },
      }),
  };
}
