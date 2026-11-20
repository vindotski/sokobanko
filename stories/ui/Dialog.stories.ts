import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: {
      Button,
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
    },
    setup: () => ({ args }),
    template: `
      <Dialog v-bind="args">
        <DialogTrigger as-child><Button>Open</Button></DialogTrigger>
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Level solved!</DialogTitle>
            <DialogDescription>Microban 7</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Replay</Button>
            <Button>Next level</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>`,
  }),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opening moves focus into the dialog; Escape closes it and returns focus. */
export const Opens: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog).toHaveAccessibleName("Level solved!");
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Open: Story = { args: { defaultOpen: true } };
