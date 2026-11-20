import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, waitFor, within } from "storybook/test";
import GameHud from "~/components/GameHud.vue";
import LevelComplete from "~/components/LevelComplete.vue";
import PauseSheet from "~/components/PauseSheet.vue";

/** The game's HUD, pause menu and level-complete screen. */
const progress = {
  moves: 23,
  pushes: 7,
  solution: "",
  log: "",
  undosLeft: 2,
  solved: false,
  canRedo: false,
  boxes: 4,
  boxesOnGoals: 2,
  deadBoxes: 0,
};

const meta = {
  title: "App/Game",
  component: GameHud,
  args: { progress, best: { moves: 74, pushes: 16 } },
} satisfies Meta<typeof GameHud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hud: Story = {
  decorators: [
    () => ({ template: '<div class="w-[24rem] border"><story /></div>' }),
  ],
};

export const HudColumn: Story = {
  args: { layout: "column" },
  decorators: [() => ({ template: '<div class="w-72"><story /></div>' })],
};

export const Paused: Story = {
  parameters: { layout: "fullscreen" },
  render: () => ({
    components: { PauseSheet },
    template: '<PauseSheet :open="true" level-id="microban-007" />',
  }),
  play: async () => {
    const sheet = within(
      await within(document.body).findByRole("dialog", { name: "Paused" }),
    );
    await expect(sheet.getByRole("button", { name: /Resume/ })).toBeVisible();
    await expect(
      sheet.getByRole("link", { name: /Quit to map/ }),
    ).toHaveAttribute("href", "/levels/microban-007");
  },
};

const complete = {
  title: "Microban 7",
  levelId: "microban-007",
  run: { moves: 70, pushes: 16 },
  best: { moves: 70, pushes: 16 },
  isNewBest: true,
  saveState: "saved" as const,
  next: { id: "microban-008", title: "Microban 8" },
  nextLocked: false,
};

export const Complete: Story = {
  parameters: { layout: "fullscreen" },
  render: () => ({
    components: { LevelComplete },
    setup: () => ({ complete }),
    template: '<LevelComplete :open="true" v-bind="complete" />',
  }),
  play: async () => {
    const dialog = within(
      await within(document.body).findByRole("dialog", {
        name: "Level complete",
      }),
    );
    await waitFor(() =>
      expect(dialog.getByRole("link", { name: /Next level/ })).toHaveAttribute(
        "href",
        "/play/microban-008",
      ),
    );
  },
};

/** Saved here while offline; the server gets it later. */
export const CompleteOffline: Story = {
  parameters: { layout: "fullscreen" },
  render: () => ({
    components: { LevelComplete },
    setup: () => ({
      complete: { ...complete, saveState: "local", isNewBest: false },
    }),
    template: '<LevelComplete :open="true" v-bind="complete" />',
  }),
};
