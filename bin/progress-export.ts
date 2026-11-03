// `pnpm progress:export`: writes the players' results, `progress/<id>.md`,
// from the sokobanko project's main into content/progress, so they can be
// looked at or backed up. Only the progress files are written; the levels and
// the progress schema are left to `pnpm levels:export`. Progress files that
// are no longer on main are removed. Nothing is sent to Spotcraft.

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { CONTENT, client, PROJECT } from "./levels-content.ts";

const DIR = join(CONTENT, "progress");
const isProgress = (path: string) =>
  path.startsWith("progress/") && path.endsWith(".md");

const api = client();
const remote = (await api.list()).map((f) => f.path).filter(isProgress);
mkdirSync(DIR, { recursive: true });
const local = readdirSync(DIR)
  .filter((name) => name.endsWith(".md"))
  .map((name) => `progress/${name}`);

let written = 0;
for (const path of remote) {
  const text = await api.read(path);
  const file = join(CONTENT, path);
  if (local.includes(path) && readFileSync(file, "utf8") === text) continue;
  writeFileSync(file, text);
  console.log(`wrote content/${path}`);
  written++;
}
let removed = 0;
for (const path of local) {
  if (!remote.includes(path)) {
    rmSync(join(CONTENT, path));
    console.log(`removed content/${path}`);
    removed++;
  }
}
console.log(
  `${PROJECT}: ${remote.length} progress files, ${written} written, ${removed} removed`,
);
