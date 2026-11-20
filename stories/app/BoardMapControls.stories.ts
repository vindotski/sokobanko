import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, fn, userEvent } from "storybook/test";
import BoardMapControls from "~/components/BoardMapControls.vue";

/** The camera buttons over the board's corner, like a map app's. */
const meta = {
  title: "App/BoardMapControls",
  component: BoardMapControls,
  args: {
    camera: {
      canZoomIn: true,
      canZoomOut: true,
      fitted: false,
      following: true,
    },
    onZoomIn: fn(),
    onZoomOut: fn(),
    onFit: fn(),
    onRecenter: fn(),
  },
} satisfies Meta<typeof BoardMapControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Following: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(canvas.getByRole("button", { name: "Zoom out" }));
    await userEvent.click(
      canvas.getByRole("button", { name: "Show whole level" }),
    );
    await expect(args.onZoomIn).toHaveBeenCalledOnce();
    await expect(args.onZoomOut).toHaveBeenCalledOnce();
    await expect(args.onFit).toHaveBeenCalledOnce();
    await expect(
      canvas.queryByRole("button", { name: "Back to player" }),
    ).toBeNull();
  },
};

/** Panned or zoomed away from the player: "Back to player" appears. */
export const LookingAround: Story = {
  args: {
    camera: {
      canZoomIn: true,
      canZoomOut: true,
      fitted: false,
      following: false,
    },
  },
  play: async ({ args, canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Back to player" }),
    );
    await expect(args.onRecenter).toHaveBeenCalledOnce();
  },
};

/** The whole level is on screen: nothing to zoom out to or fit. */
export const Fitted: Story = {
  args: {
    camera: {
      canZoomIn: true,
      canZoomOut: false,
      fitted: true,
      following: true,
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Zoom out" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Show whole level" }),
    ).toBeDisabled();
  },
};
