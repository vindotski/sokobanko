import type { Preview } from "@storybook-vue/nuxt";

/**
 * Every story in light or dark: the same `dark` class on <html> that
 * @nuxtjs/color-mode sets. Each story is also a test (addon-vitest): it must
 * render, pass its play function, and pass axe (a11y "error").
 */
const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    theme: {
      description: "Light or dark, as @nuxtjs/color-mode sets it",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (story, { globals, parameters }) => {
      const root = document.documentElement;
      // Read by the screenshot step in vitest.setup.ts.
      root.dataset.visual = parameters.visual === false ? "off" : "on";
      const dark = globals.theme === "dark";
      root.classList.toggle("dark", dark);
      root.classList.toggle("light", !dark);
      root.style.colorScheme = dark ? "dark" : "light";
      return story();
    },
  ],
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    viewport: {
      options: {
        phone: {
          name: "Phone",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet",
          styles: { width: "820px", height: "1180px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
      },
    },
    controls: { matchers: { color: /(background|color)$/i } },
  },
};

export default preview;
