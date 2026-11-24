// `pnpm db:migrate`: the migrations, on DATABASE_URL. `spotkit dev` runs it
// (spotkit.json) with the local stack's settings; on Spotcraft, the image's
// dev.spotcraft.migrate label runs the built server's copy instead.
import { fileURLToPath } from "node:url";
import { migrateDatabase } from "../server/db/migrate.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const { applied } = await migrateDatabase(
  url,
  fileURLToPath(new URL("../server/db/migrations", import.meta.url)),
);
console.info(`Migrated: ${applied} new`);
