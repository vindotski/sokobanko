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

/**
 * Level collections, such as Basics and Microban, in play order. Postgres is
 * their source: they're written by migrations (bin/import-collection.ts).
 */
export const collections = pgTable("collections", {
  /** A slug, such as `microban`. */
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  /** Where the levels come from and the terms they're shared under. */
  credit: text("credit"),
  order: integer("order").notNull(),
});

/** Levels, each in a collection. Postgres is their source, like collections. */
export const levels = pgTable("levels", {
  /** A slug, such as `first-push` or `microban-001`. */
  id: text("id").primaryKey(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id),
  title: text("title").notNull(),
  /** Position within the collection; levels without one come last. */
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
