// What bin/levels-import.ts and bin/levels-export.ts share: which paths in the
// sokobanko project this repository owns (the levels), and the management
// client. Unlike `spotcraft import`, which deletes every file missing from the
// folder, they never touch anything outside levels/.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { type Credentials, rpc } from "../apps/web/server/spotcraft/rpc.ts";

export const PROJECT = "sokobanko";
export const CONTENT = fileURLToPath(new URL("../content/", import.meta.url));

/** The levels and their schema. */
export function isManaged(path: string): boolean {
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

/**
 * The management client, from SPOTCRAFT_API_URL and Sokobanko's key
 * (SPOTCRAFT_KEY). Its versions are published as `sokobanko`.
 */
export function client() {
  const url = process.env.SPOTCRAFT_API_URL ?? "https://api.vin.ski";
  const key = process.env.SPOTCRAFT_KEY;
  if (!key) {
    console.error(
      "Set SPOTCRAFT_KEY (Sokobanko's key, sc_…), and SPOTCRAFT_API_URL if not https://api.vin.ski.",
    );
    process.exit(1);
  }
  const credentials: Credentials = { key };
  const call = <T>(procedure: string, input: unknown) =>
    rpc<T>(url, credentials, procedure, input);
  return {
    url,
    /** The published version, which a publish is made against (null: none yet). */
    published: async () =>
      (
        await call<{ slug: string; publishedVersion: number | null }[]>(
          "projects.list",
          {},
        )
      ).find((p) => p.slug === PROJECT)?.publishedVersion ?? null,
    list: () => call<{ path: string }[]>("files.list", { project: PROJECT }),
    read: async (path: string) =>
      (await call<{ text: string }>("files.read", { project: PROJECT, path }))
        .text,
    publish: (expect: number | null, message: string, changes: unknown[]) =>
      call<{ version: number }>("files.publish", {
        project: PROJECT,
        expect,
        message,
        changes,
        author: { name: "Sokobanko", email: "levels@sokobanko.vin.ski" },
      }),
  };
}
