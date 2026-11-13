import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    // Migrates the test database once, when DATABASE_URL is set.
    globalSetup: ["apps/web/server/db/migrate.setup.ts"],
  },
});
