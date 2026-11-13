import { parseLevel, replay } from "@sokoban/core";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Level, readLevels } from "./levels";
// A known solution for each level, made by bin/solve-levels.ts. They're kept
// here rather than in the database, which players can read.
import solutions from "./solutions.json";

// The levels live only in Postgres (written by the migrations), so this runs
// against a real database, like progress.test.ts. Skipped without one.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("the levels in Postgres", () => {
  const pool = new pg.Pool({ connectionString: url, max: 2 });
  const db = drizzle(pool);
  let levels: Level[] = [];

  beforeAll(async () => {
    levels = (await readLevels(db)).filter((l) => !l.id.startsWith("test-"));
  });
  afterAll(() => pool.end());

  it("are Basics, then Microban 1 to 155", () => {
    expect(levels.slice(0, 4).map((l) => l.id)).toEqual([
      "first-push",
      "big-room",
      "two-boxes",
      "hello-world",
    ]);
    const microban = levels.slice(4);
    expect(microban).toHaveLength(155);
    microban.forEach((level, index) => {
      expect(level.collection).toBe("microban");
      expect(level.number).toBe(index + 1);
      expect(level.id).toBe(`microban-${String(index + 1).padStart(3, "0")}`);
    });
  });

  it("each replay a known solution", () => {
    const known: Record<string, string> = solutions;
    const unsolved = levels.filter(
      (level) => !replay(parseLevel(level), known[level.id] ?? "").solved,
    );
    expect(unsolved.map((l) => l.id)).toEqual([]);
  });
});
