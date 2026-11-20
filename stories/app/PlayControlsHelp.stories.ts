import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, within } from "storybook/test";
import PlayControlsHelp from "~/components/PlayControlsHelp.vue";

/** Every gesture and shortcut, from Settings → Controls or the ? key. */
const meta = {
  title: "App/PlayControlsHelp",
  component: PlayControlsHelp,
  args: { open: true },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PlayControlsHelp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async () => {
    const sheet = await within(document.body).findByRole("dialog", {
      name: "Controls",
    });
    await expect(within(sheet).getByText("Undo (3 per attempt)")).toBeVisible();
  },
};

/** From the bottom on phones, without the keyboard column. */
export const Phone: Story = {
  globals: { viewport: { value: "phone" } },
};
