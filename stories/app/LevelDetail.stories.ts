import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect } from "storybook/test";
import LevelDetail from "~/components/LevelDetail.vue";
import { microban1, microban7 } from "../fixtures/levels";

/** A level's card on the map: the level-start screen, then Play. */
const meta = {
  title: "App/LevelDetail",
  component: LevelDetail,
  args: {
    level: microban7,
    collectionTitle: "Microban",
    collectionSize: 155,
    boxes: 6,
    previous: { id: "microban-006", title: "Microban 6" },
    next: { id: "microban-008", title: "Microban 8" },
  },
  decorators: [
    () => ({ template: '<div class="w-[22rem] border p-4"><story /></div>' }),
  ],
} satisfies Meta<typeof LevelDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpNext: Story = {
  args: { state: "current" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Play/ })).toHaveAttribute(
      "href",
      "/play/microban-007",
    );
  },
};

export const Solved: Story = {
  args: {
    level: microban1,
    boxes: 2,
    state: "solved",
    best: { moves: 33, pushes: 8 },
  },
};

export const NotSynced: Story = {
  args: { state: "solved", best: { moves: 74, pushes: 16 }, unsynced: true },
};

/** Locked: says which level unlocks it, and Play is off. */
export const Locked: Story = {
  args: {
    state: "locked",
    unlocker: { id: "microban-006", title: "Microban 6" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Locked/ })).toBeDisabled();
    await expect(
      canvas.getByRole("link", { name: "Microban 6" }),
    ).toHaveAttribute("href", "/levels/microban-006");
  },
};

/** Before the progress is known, as on the server: Play leads the way. */
export const Unknown: Story = {};
