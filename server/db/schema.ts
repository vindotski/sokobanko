import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.ts";

/**
 * Sokoban's own tables, in its schema on Spotcraft, `app_sokoban` (the
 * same name locally). Named here rather than left to the search path, as
 * drizzle-kit would otherwise write `"public".` into the foreign keys. Not
 * exported, so drizzle-kit doesn't try to create the schema, which Spotcraft
 * owns. The players are in Spotcraft's user pool, `auth.users`.
 */
export const SCHEMA = "app_sokoban";
const app = pgSchema(SCHEMA);

/**
 * Level collections, such as Basics and Microban, in play order. Postgres is
 * their source: they're written by migrations (scripts/import-collection.ts).
 */
export const collections = app.table(
  "collections",
  {
    /** A slug, such as `microban`. */
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    author: text("author"),
    /** Where the levels come from and the terms they're shared under. */
    credit: text("credit"),
    /** Play order, from 1. Unique, so collections never interleave. */
    order: integer("order").notNull().unique(),
  },
  (table) => [check("collections_order_positive", sql`${table.order} > 0`)],
);

/**
 * Levels, each in a collection. Postgres is their source, like collections.
 * Players' results point at them, so a level with results can't be deleted.
 */
export const levels = app.table(
  "levels",
  {
    /** A slug, such as `first-push` or `microban-001`. */
    id: text("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id),
    title: text("title").notNull(),
    /** Position within the collection, from 1; unlocking follows it. */
    order: integer("order").notNull(),
    /** The rows of the map, in XSB. */
    map: jsonb("map").$type<string[]>().notNull(),
  },
  (table) => [
    unique("levels_collection_order_unique").on(
      table.collectionId,
      table.order,
    ),
    check("levels_order_positive", sql`${table.order} > 0`),
    check("levels_map_is_array", sql`jsonb_typeof(${table.map}) = 'array'`),
  ],
);

/**
 * Each player's best result per level: fewest moves, then fewest pushes; a tie
 * keeps the older. Deleting the player deletes their results; a level with
 * results can't be deleted.
 */
export const progress = app.table(
  "progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: text("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "restrict" }),
    moves: integer("moves").notNull(),
    pushes: integer("pushes").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.levelId] }),
    check("progress_moves_positive", sql`${table.moves} > 0`),
    // Every push is a move.
    check(
      "progress_pushes_within_moves",
      sql`${table.pushes} >= 0 and ${table.pushes} <= ${table.moves}`,
    ),
  ],
);
