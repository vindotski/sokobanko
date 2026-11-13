/**
 * Turns a level collection in plain-text XSB into a SQL migration that adds
 * it to Postgres, the levels' only source:
 *
 *   pnpm --filter @sokoban/web exec drizzle-kit generate --custom --name microban
 *   node bin/import-collection.ts microban.txt apps/web/server/db/migrations/0002_microban.sql \
 *     --id microban --title Microban --order 2 --author "David W. Skinner" --credit "…"
 *
 * Every run of map rows is one level; any other line (`Level 1`, `; comment`,
 * a title, a blank line) separates them. `-` and `_` are read as floor. Each
 * level is checked with the game's own parser before anything is written.
 * Levels are numbered from 1: ids `<id>-001`, titles `<title> 1`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parseLevel } from "../packages/core/src/index.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    id: { type: "string" },
    title: { type: "string" },
    order: { type: "string" },
    author: { type: "string" },
    credit: { type: "string" },
  },
});
const [source, out] = positionals;
const { id, title, order, author, credit } = values;
if (!source || !out || !id || !title || !order || !/^\d+$/.test(order)) {
  console.error(
    "usage: node bin/import-collection.ts <source.txt> <migration.sql> --id <slug> --title <title> --order <n> [--author <name>] [--credit <text>]",
  );
  process.exit(1);
}

const ROW = /^[#@+$*. _-]*#[#@+$*. _-]*$/;
const maps: string[][] = [];
let current: string[] = [];
for (const line of readFileSync(source, "utf8").split(/\r?\n/)) {
  if (ROW.test(line.trimEnd())) {
    current.push(line.trimEnd().replace(/[-_]/g, " "));
  } else if (current.length) {
    maps.push(current);
    current = [];
  }
}
if (current.length) maps.push(current);

const digits = Math.max(3, String(maps.length).length);
const levels = maps.map((map, index) => {
  const n = index + 1;
  const level = {
    id: `${id}-${String(n).padStart(digits, "0")}`,
    title: `${title} ${n}`,
    order: n,
    map,
  };
  const width = Math.max(...map.map((row) => row.length));
  if (map.length > 50 || width > 50) {
    throw new Error(`${level.id} is ${width} by ${map.length}, over 50 by 50`);
  }
  parseLevel(level);
  return level;
});

const text = (value: string | undefined) =>
  value === undefined ? "NULL" : `'${value.replaceAll("'", "''")}'`;

const sql = [
  `-- ${title}: ${levels.length} levels, made by bin/import-collection.ts.`,
  `INSERT INTO "collections" ("id", "title", "author", "credit", "order") VALUES`,
  `\t(${text(id)}, ${text(title)}, ${text(author)}, ${text(credit)}, ${order});`,
  "--> statement-breakpoint",
  `INSERT INTO "levels" ("id", "collection_id", "title", "order", "map") VALUES`,
  `${levels
    .map(
      (level) =>
        `\t(${text(level.id)}, ${text(id)}, ${text(level.title)}, ${level.order}, ${text(JSON.stringify(level.map))})`,
    )
    .join(",\n")};`,
  "",
].join("\n");

writeFileSync(out, sql);
console.info(`${levels.length} levels written to ${out}`);
