import { sql } from "drizzle-orm";

/**
 * For the container's HEALTHCHECK: 200 once Postgres answers. Spotcraft runs
 * the migrations before a new version starts, so there's nothing to wait for.
 */
export default defineEventHandler(async () => {
  try {
    await db().execute(sql`select 1`);
  } catch (error) {
    console.error("Health check failed:", error);
    throw createError({ statusCode: 503, message: "Database unavailable" });
  }
  return { ok: true };
});
