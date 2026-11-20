import { afterEach, expect } from "vitest";
import { page } from "vitest/browser";

declare const __VISUAL__: boolean;

/**
 * Visual regression: after each story passes, the whole page (so dialogs,
 * sheets and menus portalled to <body> are in it) is compared with its
 * baseline in __screenshots__/, per theme. Only where the baselines come
 * from (__VISUAL__, see vitest.config.ts). A story opts out with
 * `parameters: { visual: false }`.
 */
afterEach(async (ctx) => {
  if (!__VISUAL__ || ctx.task.result?.state === "fail") return;
  const root = document.documentElement;
  if (root.dataset.visual === "off") return;
  const storyId =
    (ctx.task.meta as { storyId?: string }).storyId ?? ctx.task.name;
  const theme = root.classList.contains("dark") ? "dark" : "light";
  await expect
    .element(page.elementLocator(document.body))
    .toMatchScreenshot(`${storyId}-${theme}`);
});
