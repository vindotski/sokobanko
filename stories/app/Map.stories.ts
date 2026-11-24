import type { LevelState } from "@sokoban/core";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect } from "storybook/test";
import ContinueCard from "~/components/ContinueCard.vue";
import LevelNode from "~/components/LevelNode.vue";
import LevelPath from "~/components/LevelPath.vue";
import { firstPush, microban7 } from "../fixtures/levels";

/**
 * The map: a collection's levels as a winding path, solved ones filled, the
 * one up next larger, locked ones faint; and the Continue card above it.
 */
const levels = Array.from({ length: 14 }, (_, i) => ({
  id: `microban-${String(i + 1).padStart(3, "0")}`,
  title: `Microban ${i + 1}`,
  number: i + 1,
}));
const progress = (solved: number) => {
  const states: Record<string, LevelState> = {};
  const best: Record<string, { moves: number }> = {};
  levels.forEach((level, i) => {
    states[level.id] =
      i < solved ? "solved" : i === solved ? "current" : "locked";
    if (i < solved) best[level.id] = { moves: 20 + i * 3 };
  });
  return { states, best };
};

const meta = {
  title: "App/Map",
  component: LevelPath,
  args: { levels, ...progress(6) },
} satisfies Meta<typeof LevelPath>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidWay: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Level 7, Microban 7, up next" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", {
        name: "Level 1, Microban 1, solved in 20 moves",
      }),
    ).toHaveAttribute("href", "/levels/microban-001");
  },
};
/** On a desktop the path fills its space: up to 10 levels a row. */
export const MidWayWide: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [
    () => ({ template: '<div class="w-[52rem] p-6"><story /></div>' }),
  ],
};
export const Fresh: Story = { args: progress(0) };
/** Before the browser has read the player's progress, as on the server. */
export const Loading: Story = { args: { states: {}, best: {} } };

export const Nodes: Story = {
  render: () => ({
    components: { LevelNode },
    setup: () => ({
      level: { id: "microban-008", title: "Microban 8", number: 8 },
    }),
    template: `
      <div class="flex items-center gap-6 p-4">
        <LevelNode :level="level" />
        <LevelNode :level="level" state="solved" :best="{ moves: 74 }" />
        <LevelNode :level="level" state="current" />
        <LevelNode :level="level" state="locked" />
      </div>`,
  }),
};

export const Continue: Story = {
  render: () => ({
    components: { ContinueCard },
    setup: () => ({
      next: { ...microban7, collectionTitle: "Microban" },
      first: { ...firstPush, collectionTitle: "Basics" },
    }),
    template: `
      <div class="flex w-[22rem] flex-col gap-4">
        <ContinueCard :ready="false" :first="first" :solved="0" :total="159" :level-ids="[]" />
        <ContinueCard ready :next="next" :solved="16" :total="159" :level-ids="[]" />
        <ContinueCard ready :solved="159" :total="159" :level-ids="['a']" />
      </div>`,
  }),
  // One height whatever it says, so the map below never moves.
  play: async ({ canvasElement }) => {
    const heights = [...canvasElement.querySelectorAll("section")].map(
      (s) => s.getBoundingClientRect().height,
    );
    await expect(heights).toHaveLength(3);
    await expect(new Set(heights).size).toBe(1);
    // And at this width, none of it is cut short.
    for (const line of canvasElement.querySelectorAll("section .truncate")) {
      await expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth);
    }
  },
};
