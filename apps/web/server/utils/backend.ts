import { type Backend, backendFromEnv } from "@spotcraft/kit";

let instance: Backend | undefined;

/**
 * Spotcraft's backend kit: guest sessions and Drizzle over the app database.
 * Made on first use from DATABASE_URL, AUTH_SECRET and PUBLIC_URL (which
 * Spotcraft's dashboard sets, and `spotcraft dev env` writes locally), so
 * building and importing the server need no database.
 */
export function backend(): Backend {
  instance ??= backendFromEnv();
  return instance;
}

/** Closes the database connections, if any were opened. */
export async function closeBackend(): Promise<void> {
  const open = instance;
  instance = undefined;
  await open?.close();
}
