import { healthResponse } from "@spotcraft/kit/nuxt";

/**
 * For the container's HEALTHCHECK: 200 once the database is migrated, the
 * levels synced and Postgres answers. It waits for the start-up work, so a
 * deploy goes live only after the migrations have run.
 */
export default defineEventHandler(() => healthResponse(backend()));
