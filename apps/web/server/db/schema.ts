import {
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.ts";

/**
 * Sokobanko's own tables, in its schema on Spotcraft, `app_sokobanko` (the
 * same name locally). Named here rather than left to the search path, as
 * drizzle-kit would otherwise write `"public".` into the foreign keys. Not
 * exported, so drizzle-kit doesn't try to create the schema, which Spotcraft
 * owns. The players are in Spotcraft's user pool, `auth.users`.
 */
export const SCHEMA = "app_sokobanko";
const app = pgSchema(SCHEMA);

/**
 * Level collections, such as Basics and Microban, in play order. Postgres is
 * their source: they're written by migrations (bin/import-collection.ts).
 */
export const collections = app.table("collections", {
  /** A slug, such as `microban`. */
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  /** Where the levels come from and the terms they're shared under. */
  credit: text("credit"),
  order: integer("order").notNull(),
});

/** Levels, each in a collection. Postgres is their source, like collections. */
export const levels = app.table("levels", {
  /** A slug, such as `first-push` or `microban-001`. */
  id: text("id").primaryKey(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id),
  title: text("title").notNull(),
  /** Position within the collection; levels without one come last. */
  order: integer("order"),
  map: jsonb("map").$type<string[]>().notNull(),
  /**
   * The fewest moves known to solve it: the length of its solution in
   * server/utils/solutions.json, which bin/shortest-solutions.ts searches for.
   * Three stars at par or under (@sokoban/core's starsFor).
   */
  par: integer("par"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Each player's best result per level: fewest moves, a tie keeps the older. */
export const progress = app.table(
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
