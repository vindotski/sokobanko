import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { progress } from "../db/schema";

/** One level's best result. Only moves and pushes, never the solution. */
export interface Completion {
  level: string;
  moves: number;
  pushes: number;
  /** ISO 8601. */
  completedAt: string;
}

type Row = typeof progress.$inferSelect;

const completion = (row: Row): Completion => ({
  level: row.levelId,
  moves: row.moves,
  pushes: row.pushes,
  completedAt: row.completedAt.toISOString(),
});

/** A player's best results, one per level they've solved. */
export async function readProgress(
  db: NodePgDatabase,
  userId: string,
): Promise<Completion[]> {
  const rows = await db
    .select()
    .from(progress)
    .where(eq(progress.userId, userId));
  return rows.map(completion);
}

/**
 * Records a run, already replayed and verified, if it beats the player's best
 * for that level (fewer moves; a tie keeps the older one), and answers the
 * best. One statement, so two tabs saving at once can't lose the better run.
 */
export async function recordBest(
  db: NodePgDatabase,
  userId: string,
  run: Completion,
): Promise<Completion> {
  const [saved] = await db
    .insert(progress)
    .values({
      userId,
      levelId: run.level,
      moves: run.moves,
      pushes: run.pushes,
      completedAt: new Date(run.completedAt),
    })
    .onConflictDoUpdate({
      target: [progress.userId, progress.levelId],
      set: {
        moves: sql`excluded.moves`,
        pushes: sql`excluded.pushes`,
        completedAt: sql`excluded.completed_at`,
      },
      setWhere: sql`excluded.moves < ${progress.moves}`,
    })
    .returning();
  if (saved) return completion(saved);
  const [best] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.levelId, run.level)));
  if (!best) throw new Error(`No result for ${run.level} after saving one`);
  return completion(best);
}
