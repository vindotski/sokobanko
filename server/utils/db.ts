import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

let pool: pg.Pool | undefined;
let instance: NodePgDatabase | undefined;

/**
 * Drizzle over Sokoban's schema, from DATABASE_URL (Spotcraft sets it, and
 * `spotkit dev` writes it to .env). Made on first use, so building and
 * importing the server need no database. The role's search path is its schema.
 */
export function db(): NodePgDatabase {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({ connectionString: url, max: 10 });
    // A pooled connection that breaks while idle is reported here; with no
    // listener it would crash the server. The pool opens a new one when needed.
    pool.on("error", (error) =>
      console.error("Postgres connection lost:", error.message),
    );
    instance = drizzle(pool);
  }
  return instance;
}

/** Closes the database connections, if any were opened. */
export async function closeDb(): Promise<void> {
  const open = pool;
  pool = undefined;
  instance = undefined;
  await open?.end();
}
