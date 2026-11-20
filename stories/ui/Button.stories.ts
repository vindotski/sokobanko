import { ArrowRightIcon, PlusIcon } from "@lucide/vue";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent } from "storybook/test";
import { ref } from "vue";
import { Button } from "~/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "ghost", "link", "destructive"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm"],
    },
  },
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: '<Button v-bind="args">Play</Button>',
  }),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "default" },
  render: (args) => ({
    components: { Button },
    setup: () => ({ args, clicks: ref(0) }),
    template: `
      <div class="flex items-center gap-3">
        <Button v-bind="args" @click="clicks++">Play</Button>
        <output class="font-mono text-small">{{ clicks }} clicks</output>
      </div>`,
  }),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Play" }));
    await expect(canvas.getByText("1 clicks")).toBeVisible();
  },
};

export const Variants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
        <Button disabled>Disabled</Button>
      </div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { Button, PlusIcon, ArrowRightIcon },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Button size="lg">Large</Button>
        <Button>Default</Button>
        <Button size="sm">Small</Button>
        <Button size="icon" aria-label="Add"><PlusIcon /></Button>
        <Button size="icon-sm" variant="outline" aria-label="Add"><PlusIcon /></Button>
        <Button>Next level <ArrowRightIcon data-icon="inline-end" /></Button>
      </div>`,
  }),
};
