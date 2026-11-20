import { Volume2Icon } from "@lucide/vue";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent } from "storybook/test";
import { Toggle } from "~/components/ui/toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  render: (args) => ({
    components: { Toggle, Volume2Icon },
    setup: () => ({ args }),
    template:
      '<Toggle v-bind="args" aria-label="Sound"><Volume2Icon /> Sound</Toggle>',
  }),
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("button", { name: "Sound" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  },
};

export const On: Story = { args: { defaultValue: true } };
