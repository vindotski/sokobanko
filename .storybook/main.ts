import type { StorybookConfig } from "@storybook-vue/nuxt";

/**
 * Storybook for Sokobanko's components, inside the Nuxt app (auto-imports,
 * color mode and Tailwind work in stories). Stories live in stories/, outside
 * app/components, where Nuxt would register them as components.
 */
const config: StorybookConfig = {
  framework: { name: "@storybook-vue/nuxt", options: {} },
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.ts"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  // The board (@sokobanko/game) is imported only when a story mounts it, too
  // late for Vite to find PixiJS's CommonJS dependency and pre-bundle it.
  viteFinal: (config) => {
    config.optimizeDeps ??= {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include ?? []),
      "@sokobanko/game > pixi.js",
      "@sokobanko/game > pixi.js > eventemitter3",
    ];
    return config;
  },
  // public/color-mode.js, loaded by preview-head.html.
  staticDirs: ["./public"],
};

export default config;
