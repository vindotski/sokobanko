import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect } from "storybook/test";
import LevelCard from "~/components/LevelCard.vue";
import { microban1, microban7, twoBoxes } from "../fixtures/levels";

/** A level on the Levels page: solved with its best, up next, or locked. */
const meta = {
  title: "App/LevelCard",
  component: LevelCard,
  decorators: [() => ({ template: '<div class="w-64"><story /></div>' })],
} satisfies Meta<typeof LevelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solved: Story = {
  args: { level: microban1, boxes: 2, state: "solved", best: { moves: 33 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link")).toHaveAttribute(
      "href",
      "/play/microban-001",
    );
    await expect(canvas.getByText(/33 moves/)).toBeVisible();
  },
};

export const UpNext: Story = {
  args: { level: microban7, boxes: 4, state: "current" },
};

export const Locked: Story = {
  args: { level: twoBoxes, boxes: 2, state: "locked" },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
