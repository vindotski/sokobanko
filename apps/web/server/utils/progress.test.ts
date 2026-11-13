import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { levels } from "../db/schema";
import { type Completion, readProgress, recordBest } from "./progress";

// Against a real database: from apps/web, `npx spotcraft dev start --name
// sokobanko`, then DATABASE_URL=… pnpm test. Skipped without one.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("progress in Postgres", () => {
  const pool = new pg.Pool({ connectionString: url, max: 2 });
  const db = drizzle(pool);
  const level = `test-${randomUUID().slice(0, 8)}`;
  const users: string[] = [];

  const newPlayer = async () => {
    const id = randomUUID();
    await db.execute(
      sql`insert into auth.users (id, name, email, is_anonymous) values (${id}, 'Test', ${`${id}@test.invalid`}, true)`,
    );
    users.push(id);
    return id;
  };
  const run = (moves: number, pushes = 1, at = "2026-11-08T10:00:00.000Z") =>
    ({ level, moves, pushes, completedAt: at }) satisfies Completion;

  beforeAll(async () => {
    await db.insert(levels).values({
      id: level,
      collectionId: "basics",
      title: "Test",
      map: ["#@$.#"],
    });
  });

  afterAll(async () => {
    await db.execute(sql`delete from public.levels where id = ${level}`);
    for (const id of users)
      await db.execute(sql`delete from auth.users where id = ${id}`);
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

  it("goes with the player", async () => {
    const player = await newPlayer();
    await recordBest(db, player, run(4));
    await db.execute(sql`delete from auth.users where id = ${player}`);
    const left = await db.execute(
      sql`select count(*)::int as n from public.progress where user_id = ${player}`,
    );
    expect(left.rows[0]).toEqual({ n: 0 });
  });
});
