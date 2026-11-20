import type { LevelState } from "@sokobanko/core";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent, within } from "storybook/test";
import LevelSwitcher from "~/components/LevelSwitcher.vue";
import { collections, levels, microban1, microban7 } from "../fixtures/levels";

/** The level picker, opened from the level's name on the play page. */
const states = new Map<string, LevelState>([
  ["first-push", "solved"],
  ["big-room", "solved"],
  ["two-boxes", "current"],
  ["microban-001", "solved"],
  ["microban-007", "current"],
]);

const meta = {
  title: "App/LevelSwitcher",
  component: LevelSwitcher,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    levels,
    collections,
    current: microban7,
    states,
    best: {
      "first-push": { moves: 5 },
      "big-room": { moves: 45 },
      [microban1.id]: { moves: 33 },
    },
  },
} satisfies Meta<typeof LevelSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens on the current level's collection; tabs switch collection. */
export const Open: Story = {
  play: async () => {
    const sheet = within(
      await within(document.body).findByRole("dialog", { name: "Levels" }),
    );
    await expect(sheet.getByRole("tab", { name: "Microban" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      sheet.getByRole("link", { name: /Microban 7/ }),
    ).toHaveAttribute("aria-current", "page");
    await userEvent.click(sheet.getByRole("tab", { name: "Basics" }));
    await expect(sheet.getByText("2 of 3 solved")).toBeVisible();
    await userEvent.click(sheet.getByRole("tab", { name: "Microban" }));
  },
};

export const Phone: Story = { globals: { viewport: { value: "phone" } } };
