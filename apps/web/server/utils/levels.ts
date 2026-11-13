import type { LevelJson } from "@sokoban/core";
import { asc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { collections, levels } from "../db/schema";

/** A level as the API returns it. */
export interface Level extends LevelJson {
  /** The collection's id, such as `microban`. */
  collection: string;
  /** Position within the collection, from 1. */
  number: number;
}

/** A collection as the API returns it, in play order. */
export interface Collection {
  id: string;
  title: string;
  author: string | null;
  credit: string | null;
}

/**
 * Every level in play order: collection by collection, then by `order`
 * (levels without one last), then by id. Unlocking follows this order.
 */
export async function getLevels(): Promise<Level[]> {
  await databaseReady();
  return readLevels(backend().db);
}

/** getLevels() on a given database, for the tests. */
export async function readLevels(db: NodePgDatabase): Promise<Level[]> {
  const rows = await db
    .select({
      id: levels.id,
      title: levels.title,
      map: levels.map,
      collection: levels.collectionId,
    })
    .from(levels)
    .innerJoin(collections, eq(levels.collectionId, collections.id))
    .orderBy(
      asc(collections.order),
      sql`${levels.order} asc nulls last`,
      asc(levels.id),
    );
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const number = (seen.get(row.collection) ?? 0) + 1;
    seen.set(row.collection, number);
    return { ...row, number };
  });
}

/** Every collection in play order. */
export async function getCollections(): Promise<Collection[]> {
  await databaseReady();
  return backend()
    .db.select({
      id: collections.id,
      title: collections.title,
      author: collections.author,
      credit: collections.credit,
    })
    .from(collections)
    .orderBy(asc(collections.order), asc(collections.id));
}
