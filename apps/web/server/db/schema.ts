import { users } from "@spotcraft/kit/schema";
import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Sokobanko's own tables, in the app database's `public` schema. Spotcraft's
 * kit owns `auth.*` (guests and sessions); `users` is imported only as the
 * foreign key target and is not exported, so drizzle-kit leaves it alone.
 */

/** Levels, synced from content/levels/*.md at startup (server/plugins/database.ts). */
export const levels = pgTable("levels", {
  /** The file's slug, such as `first-push`. */
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  /** Play order; levels without one come last. */
  order: integer("order"),
  map: jsonb("map").$type<string[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Each player's best result per level: fewest moves, a tie keeps the older. */
export const progress = pgTable(
  "progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: text("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    moves: integer("moves").notNull(),
    pushes: integer("pushes").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.levelId] })],
);
