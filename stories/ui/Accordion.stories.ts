import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent } from "storybook/test";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  render: () => ({
    components: {
      Accordion,
      AccordionContent,
      AccordionItem,
      AccordionTrigger,
    },
    template: `
      <Accordion type="single" collapsible class="w-96">
        <AccordionItem value="pull">
          <AccordionTrigger>Can I pull a box?</AccordionTrigger>
          <AccordionContent>No. Boxes can only be pushed, one at a time.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="undo">
          <AccordionTrigger>How many undos do I get?</AccordionTrigger>
          <AccordionContent>Three per attempt. Restart gives them back.</AccordionContent>
        </AccordionItem>
      </Accordion>`,
  }),
} satisfies Meta<typeof Accordion>;

export default meta;

export const FAQ: StoryObj<typeof meta> = {
  play: async ({ canvas }) => {
    const question = canvas.getByRole("button", { name: "Can I pull a box?" });
    await userEvent.click(question);
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(/only be pushed/)).toBeVisible();
  },
};
