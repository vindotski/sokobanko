// `pnpm levels:import`: publishes content/levels to the sokobanko project as
// its next version, holding only what changed. Nothing outside levels/ is
// touched. A CONFLICT means someone published meanwhile: run it again.

import { SpotcraftRpcError } from "../apps/web/server/spotcraft/rpc.ts";
import { client, isManaged, localFiles, PROJECT } from "./levels-content.ts";

const api = client();
const local = localFiles();

const expect = await api.published();
const remote = (await api.list()).map((f) => f.path).filter(isManaged);
const changes: (
  | { path: string; content: string }
  | { path: string; delete: true }
)[] = [];
for (const [path, text] of local) {
  if (!remote.includes(path) || (await api.read(path)) !== text) {
    changes.push({ path, content: text });
  }
}
// Levels removed here are unpublished there.
for (const path of remote) {
  if (!local.has(path)) changes.push({ path, delete: true });
}
if (changes.length === 0) {
  console.log(`${PROJECT}: levels unchanged (${local.size} files)`);
  process.exit(0);
}
try {
  const saved = await api.publish(
    expect,
    "levels: import from the sokobanko repository",
    changes,
  );
  for (const change of changes) {
    console.log(`${"delete" in change ? "deleted" : "wrote"} ${change.path}`);
  }
  console.log(`${PROJECT}: published version ${saved.version}`);
} catch (error) {
  if (error instanceof SpotcraftRpcError && error.code === "CONFLICT") {
    console.error(`${PROJECT}: someone published meanwhile; run it again`);
    process.exit(1);
  }
  if (error instanceof SpotcraftRpcError && error.code === "INVALID") {
    console.error(`${PROJECT}: refused, the levels aren't valid:`);
    console.error(JSON.stringify(error.data, null, 2));
    process.exit(1);
  }
  throw error;
}
