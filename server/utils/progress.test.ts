import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { levels } from "../db/schema";
import { type Completion, readProgress, recordBest } from "./progress";

// Against the local stack: `pnpm exec spotcraft dev`, then
// `set -a; . ./.env; set +a; pnpm test`. Players are guests of its user pool,
// as on Spotcraft. Skipped without DATABASE_URL.
const url = process.env.DATABASE_URL;
const authUrl = process.env.AUTH_URL;

describe.skipIf(!url)("progress in Postgres", () => {
  const pool = new pg.Pool({ connectionString: url, max: 2 });
  const db = drizzle(pool);
  const level = `test-${randomUUID().slice(0, 8)}`;
  /**
   * A new guest, made as a browser makes one. The app may only read and
   * reference users. Each from its own address, so the pool's limit on new
   * guests per address doesn't stop repeated runs.
   */
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
  const run = (moves: number, pushes = 1, at = "2026-11-08T10:00:00.000Z") =>
    ({ level, moves, pushes, completedAt: at }) satisfies Completion;

  beforeAll(async () => {
    await db.insert(levels).values({
      id: level,
      collectionId: "basics",
      title: "Test",
      // Unique within Basics, and after its levels.
      order: 1000 + Math.floor(Math.random() * 1_000_000),
      map: ["#@$.#"],
    });
  });

  afterAll(async () => {
    // A level with results can't be deleted, so they go first. The guests stay
    // in the local pool, which deletes idle ones.
    await db.execute(sql`delete from progress where level_id = ${level}`);
    await db.execute(sql`delete from levels where id = ${level}`);
    await pool.end();
  });

  it("is empty for a new player", async () => {
    expect(await readProgress(db, await newPlayer())).toEqual([]);
  });

  it("keeps the fewest moves, and a tie keeps the older run", async () => {
    const player = await newPlayer();
    expect(await recordBest(db, player, run(10))).toEqual(run(10));
    expect(await recordBest(db, player, run(12))).toEqual(run(10));
    expect(
      await recordBest(db, player, run(10, 1, "2026-11-09T00:00:00.000Z")),
    ).toEqual(run(10));
    const better = run(7, 3, "2026-11-09T00:00:00.000Z");
    expect(await recordBest(db, player, better)).toEqual(better);
    expect(await readProgress(db, player)).toEqual([better]);
  });

  it("at equal moves, keeps the fewer pushes", async () => {
    const player = await newPlayer();
    await recordBest(db, player, run(10, 4));
    expect(await recordBest(db, player, run(10, 6))).toEqual(run(10, 4));
    const fewerPushes = run(10, 2, "2026-11-09T00:00:00.000Z");
    expect(await recordBest(db, player, fewerPushes)).toEqual(fewerPushes);
    // Fewer moves still wins, whatever the pushes.
    const fewerMoves = run(9, 5, "2026-11-10T00:00:00.000Z");
    expect(await recordBest(db, player, fewerMoves)).toEqual(fewerMoves);
  });

  it("refuses impossible results", async () => {
    const player = await newPlayer();
    await expect(recordBest(db, player, run(0, 0))).rejects.toThrow();
    // More pushes than moves.
    await expect(recordBest(db, player, run(3, 4))).rejects.toThrow();
  });

  it("keeps results when their level is deleted", async () => {
    const player = await newPlayer();
    await recordBest(db, player, run(5));
    await expect(
      db.execute(sql`delete from levels where id = ${level}`),
    ).rejects.toThrow();
    expect(await readProgress(db, player)).toHaveLength(1);
  });

  it("keeps the best when two saves race", async () => {
    const player = await newPlayer();
    await Promise.all(
      [9, 5, 8, 6].map((moves) => recordBest(db, player, run(moves))),
    );
    expect((await readProgress(db, player)).map((c) => c.moves)).toEqual([5]);
  });

  it("is per player", async () => {
    const [a, b] = [await newPlayer(), await newPlayer()];
    await recordBest(db, a, run(4));
    expect(await readProgress(db, b)).toEqual([]);
  });

  it("goes with the player: deleting a user in the pool deletes it", async () => {
    // Only the pool may delete users, so this checks the foreign key.
    const fk = await db.execute(
      sql`select confdeltype from pg_constraint
          where conrelid = 'progress'::regclass and confrelid = 'auth.users'::regclass`,
    );
    expect(fk.rows).toEqual([{ confdeltype: "c" }]);
  });
});
