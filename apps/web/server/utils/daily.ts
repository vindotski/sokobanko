import {
  dailyLevel,
  dailyNumber,
  nextDailyAt,
  streak,
  utcDay,
} from "@sokoban/core";
import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dailyResults } from "../db/schema";
import type { Level } from "./levels";

/**
 * Collections the daily never picks from: Basics teaches the rules, and a
 * five-move level makes a poor puzzle of the day.
 */
const NOT_DAILY = new Set(["basics"]);

/** Today's daily puzzle, by UTC date. */
export interface Daily {
  /** `YYYY-MM-DD`, UTC. */
  day: string;
  /** From 1, as shown and shared. */
  number: number;
  level: Level;
  /** ISO 8601: when the next puzzle starts. */
  nextAt: string;
}

/** The daily puzzle for `now`, from the levels in play order. */
export function dailyFor(levels: Level[], now = new Date()): Daily | undefined {
  const day = utcDay(now);
  const pool = levels.filter((l) => !NOT_DAILY.has(l.collection));
  const id = dailyLevel(
    day,
    pool.map((l) => l.id),
  );
  const level = pool.find((l) => l.id === id);
  if (!level) return undefined;
  return {
    day,
    number: dailyNumber(day),
    level,
    nextAt: nextDailyAt(now).toISOString(),
  };
}

/** One day's best result. Only moves and pushes, never the solution. */
export interface DailyResult {
  day: string;
  level: string;
  moves: number;
  pushes: number;
}

type Row = typeof dailyResults.$inferSelect;

const result = (row: Row): DailyResult => ({
  day: row.day,
  level: row.levelId,
  moves: row.moves,
  pushes: row.pushes,
});

/** A player's daily results, one per day they solved it. */
export async function readDaily(
  db: NodePgDatabase,
  userId: string,
): Promise<DailyResult[]> {
  const rows = await db
    .select()
    .from(dailyResults)
    .where(eq(dailyResults.userId, userId));
  return rows.map(result);
}

/** Days in a row solved, ending today (or yesterday, while today is open). */
export function dailyStreak(results: DailyResult[], today: string) {
  return streak(
    results.map((r) => r.day),
    today,
  );
}

/**
 * Records a day's run, already replayed and verified, if it beats the
 * player's best for that day (fewer moves), and answers the best. One
 * statement, like recordBest in progress.ts.
 */
export async function recordDaily(
  db: NodePgDatabase,
  userId: string,
  run: DailyResult,
): Promise<DailyResult> {
  const [saved] = await db
    .insert(dailyResults)
    .values({
      userId,
      day: run.day,
      levelId: run.level,
      moves: run.moves,
      pushes: run.pushes,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [dailyResults.userId, dailyResults.day],
      set: {
        moves: sql`excluded.moves`,
        pushes: sql`excluded.pushes`,
        completedAt: sql`excluded.completed_at`,
      },
      setWhere: sql`excluded.moves < ${dailyResults.moves}`,
    })
    .returning();
  if (saved) return result(saved);
  const [best] = await db
    .select()
    .from(dailyResults)
    .where(and(eq(dailyResults.userId, userId), eq(dailyResults.day, run.day)));
  if (!best) throw new Error(`No daily result for ${run.day} after saving one`);
  return result(best);
}
