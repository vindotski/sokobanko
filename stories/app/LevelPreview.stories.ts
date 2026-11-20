import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import LevelPreview from "~/components/LevelPreview.vue";
import {
  bigRoom,
  deadBox,
  firstPush,
  microban1,
  microban7,
  twoBoxes,
} from "../fixtures/levels";

/**
 * A level drawn in SVG, as on the level cards and in the level switcher. The
 * same shapes as the game's board: pieces differ by shape, not colour.
 */
const meta = {
  title: "App/LevelPreview",
  component: LevelPreview,
  args: { level: microban7, frameAspect: 4 / 3 },
  decorators: [
    () => ({ template: '<div class="h-48 w-64 bg-muted p-4"><story /></div>' }),
  ],
} satisfies Meta<typeof LevelPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BoxesOnGoals: Story = {};
export const Corridor: Story = { args: { level: firstPush } };
export const Small: Story = { args: { level: twoBoxes } };
/** A box already on a goal, drawn with a tick. */
export const BoxOnGoal: Story = { args: { level: microban1 } };
export const Large: Story = { args: { level: bigRoom } };
/** A box on a dead square gets a cross: it can never reach a goal. */
export const DeadBox: Story = { args: { level: deadBox } };
