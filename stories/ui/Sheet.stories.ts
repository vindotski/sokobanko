import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: { layout: "fullscreen" },
  argTypes: {
    side: { control: "select", options: ["right", "bottom", "left", "top"] },
  },
  args: { side: "right" },
  render: (args) => ({
    components: {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetHeader,
      SheetTitle,
    },
    setup: () => ({ args }),
    template: `
      <Sheet :default-open="true">
        <SheetContent :side="args.side">
          <SheetHeader>
            <SheetTitle>Levels</SheetTitle>
            <SheetDescription>Choose a level to play.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>`,
  }),
} satisfies Meta<{ side: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {};
/** Phones get sheets from the bottom, within thumb reach. */
export const Bottom: Story = { args: { side: "bottom" } };
