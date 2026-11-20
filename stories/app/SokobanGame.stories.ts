import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, fn, waitFor } from "storybook/test";
import SokobanGame from "~/components/SokobanGame.vue";
import { firstPush, microban7, twoBoxes } from "../fixtures/levels";

/**
 * The real PixiJS board (@sokobanko/game). It follows the theme, moves with
 * the arrow keys or WASD, and reports each move, the solve, and the camera.
 */
const meta = {
  title: "App/SokobanGame",
  component: SokobanGame,
  parameters: {
    layout: "fullscreen",
    // Screenshots don't capture the WebGL canvas, so the board isn't compared
    // visually; LevelPreview's screenshots cover the same pieces in SVG.
    visual: false,
  },
  args: {
    level: microban7,
    label: "A Sokoban board. Arrow keys or WASD to move.",
    onChange: fn(),
    onSolved: fn(),
    onCamera: fn(),
  },
  decorators: [
    () => ({ template: '<div class="h-[480px] w-full"><story /></div>' }),
  ],
  render: (args) => ({
    components: { SokobanGame },
    setup: () => ({ args }),
    template: '<SokobanGame v-bind="args" class="size-full" />',
  }),
} satisfies Meta<typeof SokobanGame>;

export default meta;
type Story = StoryObj<typeof meta>;

const press = (code: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: code, code }));
  window.dispatchEvent(new KeyboardEvent("keyup", { key: code, code }));
};

/** Ready to play: the board reports its starting position. */
export const Ready: Story = {
  play: async ({ args }) => {
    await waitFor(() => expect(args.onChange).toHaveBeenCalled(), {
      timeout: 5000,
    });
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ moves: 0, pushes: 0, boxes: 6, undosLeft: 3 }),
    );
  },
};

/** A walk and a push, counted; the input log records them. */
export const Moves: Story = {
  args: { level: twoBoxes },
  play: async ({ args }) => {
    await waitFor(() => expect(args.onChange).toHaveBeenCalled(), {
      timeout: 5000,
    });
    press("ArrowDown");
    press("ArrowRight");
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ moves: 2, pushes: 0, log: "dr" }),
      ),
    );
  },
};

/** Pushing the box onto the goal solves the level. */
export const Solves: Story = {
  args: { level: firstPush },
  play: async ({ args }) => {
    await waitFor(() => expect(args.onChange).toHaveBeenCalled(), {
      timeout: 5000,
    });
    for (let i = 0; i < 5; i++) press("ArrowRight");
    await waitFor(() =>
      expect(args.onSolved).toHaveBeenCalledWith(
        expect.objectContaining({
          solved: true,
          moves: 5,
          pushes: 3,
          solution: "rrRRR",
        }),
      ),
    );
  },
};
