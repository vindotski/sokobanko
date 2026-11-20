import { eq } from "drizzle-orm";
import { users } from "../db/auth";

/** The visitor's guest, if they've saved anything yet (one is made only then). */
export interface Me {
  guest: { since: string } | null;
}

export default defineEventHandler(async (event): Promise<Me> => {
  const guest = event.context.guest;
  if (!guest) return { guest: null };
  const [row] = await db()
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, guest.id));
  return { guest: row ? { since: row.createdAt.toISOString() } : null };
});
