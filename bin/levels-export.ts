// `pnpm levels:export`: writes the sokobanko project's published levels into
// content/levels, after they were edited in Spotcraft's dashboard, so git keeps
// being their source. Nothing outside levels/ is copied.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CONTENT,
  client,
  isManaged,
  localFiles,
  PROJECT,
} from "./levels-content.ts";

const api = client();
const remote = (await api.list()).map((f) => f.path).filter(isManaged);
const local = localFiles();
let written = 0;
for (const path of remote) {
  const text = await api.read(path);
  if (local.get(path) === text) continue;
  mkdirSync(dirname(join(CONTENT, path)), { recursive: true });
  writeFileSync(join(CONTENT, path), text);
  console.log(`wrote content/${path}`);
  written++;
}
let removed = 0;
for (const path of local.keys()) {
  if (!remote.includes(path)) {
    rmSync(join(CONTENT, path));
    console.log(`removed content/${path}`);
    removed++;
  }
}
console.log(`${PROJECT}: ${written} written, ${removed} removed`);
