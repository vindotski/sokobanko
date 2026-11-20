import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    // Migrates the test database once, when DATABASE_URL is set.
    globalSetup: ["server/db/migrate.setup.ts"],
  },
});
