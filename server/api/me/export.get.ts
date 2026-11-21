import { eq } from "drizzle-orm";
import { users } from "../../db/auth";

/**
 * Everything the server keeps about the visitor, for Progress → Your data
 * (the right of access and to portability): their guest and their results.
 * The browser adds what it keeps itself. Nothing before their first save.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");
  const guest = event.context.guest;
  if (!guest) return { guest: null, results: [] };
  const database = db();
  const [user] = await database
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, guest.id));
  const results = await readProgress(database, guest.id);
  return {
    guest: { id: guest.id, createdAt: user?.createdAt.toISOString() ?? null },
    results: results.sort((a, b) => a.completedAt.localeCompare(b.completedAt)),
  };
});
