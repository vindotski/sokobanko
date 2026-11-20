import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { levels } from "../db/schema";
import {
  type DailyResult,
  dailyFor,
  dailyStreak,
  readDaily,
  recordDaily,
} from "./daily";
import type { Level } from "./levels";

describe("dailyFor", () => {
  const level = (id: string, collection: string): Level => ({
    id,
    title: id,
    map: ["#@$.#"],
    collection,
    number: 1,
    par: 1,
  });
  const all = [
    level("first-push", "basics"),
    ...Array.from({ length: 5 }, (_, i) =>
      level(`microban-00${i}`, "microban"),
    ),
  ];

  it("never picks from Basics", () => {
    for (let d = 0; d < 30; d++) {
      const now = new Date(Date.UTC(2026, 11, 1 + d, 12));
      expect(dailyFor(all, now)?.level.collection).toBe("microban");
    }
  });

  it("is the same all day, by UTC date", () => {
    const morning = dailyFor(all, new Date("2026-12-05T00:00:00Z"));
    const night = dailyFor(all, new Date("2026-12-05T23:59:59Z"));
    expect(night).toEqual(morning);
    expect(morning?.day).toBe("2026-12-05");
    expect(morning?.nextAt).toBe("2026-12-06T00:00:00.000Z");
  });
});

// Against the local stack, like progress.test.ts. Skipped without it.
const url = process.env.DATABASE_URL;
const authUrl = process.env.AUTH_URL;

describe.skipIf(!url)("daily results in Postgres", () => {
  const pool = new pg.Pool({ connectionString: url, max: 2 });
  const db = drizzle(pool);
  const level = `test-${randomUUID().slice(0, 8)}`;
  const newPlayer = async () => {
    const response = await fetch(`${authUrl}/sign-in/anonymous`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-spotcraft-client-ip": `198.51.100.${Math.floor(Math.random() * 250)}`,
      },
      body: "{}",
    });
    if (!response.ok) throw new Error(`The pool answered ${response.status}`);
    const { user } = (await response.json()) as { user: { id: string } };
    return user.id;
  };
  const run = (day: string, moves: number): DailyResult => ({
    day,
    level,
    moves,
    pushes: 1,
  });

  beforeAll(async () => {
    await db.insert(levels).values({
      id: level,
      collectionId: "basics",
      title: "Test",
      map: ["#@$.#"],
    });
  });

  afterAll(async () => {
    await db.execute(sql`delete from levels where id = ${level}`);
    await pool.end();
  });

  it("keeps the fewest moves for each day", async () => {
    const player = await newPlayer();
    expect(await recordDaily(db, player, run("2026-12-01", 10))).toEqual(
      run("2026-12-01", 10),
    );
    expect(await recordDaily(db, player, run("2026-12-01", 12))).toEqual(
      run("2026-12-01", 10),
    );
    expect(await recordDaily(db, player, run("2026-12-01", 8))).toEqual(
      run("2026-12-01", 8),
    );
    expect(await readDaily(db, player)).toEqual([run("2026-12-01", 8)]);
  });

  it("counts a streak across days", async () => {
    const player = await newPlayer();
    for (const day of ["2026-12-01", "2026-12-02", "2026-12-03"]) {
      await recordDaily(db, player, run(day, 5));
    }
    const results = await readDaily(db, player);
    expect(dailyStreak(results, "2026-12-03")).toBe(3);
    expect(dailyStreak(results, "2026-12-04")).toBe(3);
    expect(dailyStreak(results, "2026-12-05")).toBe(0);
  });
});
