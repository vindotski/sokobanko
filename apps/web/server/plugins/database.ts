import { startup } from "@spotcraft/kit/nuxt";

/**
 * Migrates the database (which also writes the levels) before the server goes
 * live. If that fails, the server exits, so the deploy fails and the previous
 * version keeps serving. In dev, the first query does it instead
 * (databaseReady).
 */
export default defineNitroPlugin(async (nitroApp) => {
  if (import.meta.prerender || import.meta.dev) return;
  await startup(nitroApp, backend, await prepareOptions());
});
