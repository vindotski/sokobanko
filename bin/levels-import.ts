// `pnpm levels:import`: publishes content/levels and content/progress/_schema.yaml
// to the sokobanko project's main, as one commit holding only what changed.
// Players' files (progress/<id>.md) are never touched. Retries if main moves
// meanwhile, as it does whenever a player saves a new best.

import { SpotcraftRpcError } from "../apps/web/server/spotcraft/rpc.ts";
import { client, isManaged, localFiles, PROJECT } from "./levels-content.ts";

const api = client();
const local = localFiles();

for (let attempt = 1; attempt <= 5; attempt++) {
  const base = await api.main();
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
  // Levels removed here are unpublished there; the progress schema always stays.
  for (const path of remote) {
    if (!local.has(path) && path.startsWith("levels/")) {
      changes.push({ path, delete: true });
    }
  }
  if (changes.length === 0) {
    console.log(`${PROJECT}: levels unchanged (${local.size} files)`);
    process.exit(0);
  }
  try {
    const saved = await api.save(
      base,
      "levels: import from the sokobanko repository",
      changes,
    );
    for (const change of changes) {
      console.log(`${"delete" in change ? "deleted" : "wrote"} ${change.path}`);
    }
    console.log(`${PROJECT}: committed ${saved.commit.slice(0, 12)} on main`);
    process.exit(0);
  } catch (error) {
    if (error instanceof SpotcraftRpcError && error.code === "CONFLICT")
      continue;
    if (error instanceof SpotcraftRpcError && error.code === "INVALID") {
      console.error(`${PROJECT}: refused, the commit isn't valid:`);
      console.error(JSON.stringify(error.data, null, 2));
      process.exit(1);
    }
    throw error;
  }
}
console.error(`${PROJECT}: main kept moving; try again`);
process.exit(1);
