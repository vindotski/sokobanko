import { sql } from "drizzle-orm";

/** For the container's HEALTHCHECK: up once the database is migrated and reachable. */
export default defineEventHandler(async () => {
  try {
    await databaseReady();
    await backend().db.execute(sql`select 1`);
  } catch (error) {
    console.error("Health check failed:", error);
    throw createError({ statusCode: 503, message: "Database unavailable" });
  }
  return { ok: true };
});
