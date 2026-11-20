import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Two kinds of tests:
 * - `unit`: plain Node tests for the packages, the app's helpers and the
 *   server (the database tests run once DATABASE_URL is set).
 * - `storybook-light` and `storybook-dark`: every story in stories/ rendered
 *   in headless Chromium in that theme, with its play function, axe, and a
 *   screenshot compared with its baseline (.storybook/vitest.setup.ts).
 */
const storybook = (theme: "light" | "dark") => ({
  extends: true as const,
  plugins: [storybookTest({ initialGlobals: { theme } })],
  // The board (@sokobanko/game) is imported only when a story mounts it, too
  // late for Vite to find PixiJS's CommonJS dependency and pre-bundle it.
  optimizeDeps: {
    include: [
      "@sokobanko/game > pixi.js",
      "@sokobanko/game > pixi.js > eventemitter3",
    ],
  },
  define: {
    // Screenshots are compared only where the baselines are rendered: CI's
    // Linux Chromium. Elsewhere fonts render differently, so they're skipped.
    __VISUAL__: JSON.stringify(
      process.platform === "linux" || process.env.VISUAL === "1",
    ),
  },
  test: {
    name: `storybook-${theme}`,
    setupFiles: [".storybook/vitest.setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" as const }],
      viewport: { width: 1280, height: 800 },
      // Gives @nuxtjs/color-mode the helper its server-rendered page would.
      testerHtmlPath: ".storybook/vitest.html",
    },
  },
});

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: ["**/node_modules/**", ".nuxt/**", ".output/**"],
          // Migrates the test database once, when DATABASE_URL is set.
          globalSetup: ["server/db/migrate.setup.ts"],
        },
      },
      storybook("light"),
      storybook("dark"),
    ],
  },
});
