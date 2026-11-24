import { boolean, pgSchema, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Spotcraft's user pool, shared by every app on the server. Sokoban may read
 * these columns and point foreign keys at `id`; it never migrates them, so
 * this file isn't in drizzle.config.ts's `schema`.
 */
export const users = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey(),
  isAnonymous: boolean("is_anonymous").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
