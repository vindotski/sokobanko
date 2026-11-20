import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { Progress } from "~/components/ui/progress";

const meta = {
  title: "UI/Progress",
  component: Progress,
  args: { modelValue: 40 },
  render: (args) => ({
    components: { Progress },
    setup: () => ({ args }),
    template: '<Progress v-bind="args" class="w-64" aria-label="Solved" />',
  }),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Partly: Story = {};
export const Empty: Story = { args: { modelValue: 0 } };
export const Full: Story = { args: { modelValue: 100 } };
