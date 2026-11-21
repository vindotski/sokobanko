import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, fn, userEvent, within } from "storybook/test";
import DataControls from "~/components/DataControls.vue";
import LegalLinks from "~/components/LegalLinks.vue";
import StorageList from "~/components/StorageList.vue";

/**
 * Privacy: Progress → Your data (download or delete everything), the links to
 * the legal pages, and the privacy policy's list of cookies and storage.
 */
const meta = {
  title: "App/Legal",
  component: DataControls,
  args: { onDownload: fn(), onDelete: fn() },
  decorators: [() => ({ template: '<div class="w-[24rem]"><story /></div>' })],
} satisfies Meta<typeof DataControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Deleting asks first: Cancel does nothing, the dialog's button deletes. */
export const YourData: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Download my data" }),
    );
    await expect(args.onDownload).toHaveBeenCalledOnce();

    const body = within(document.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete my data" }),
    );
    let dialog = within(
      await body.findByRole("dialog", { name: "Delete your data?" }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await expect(args.onDelete).not.toHaveBeenCalled();

    // Once the dialog has closed, the page can be reached again.
    await userEvent.click(
      await canvas.findByRole("button", { name: "Delete my data" }),
    );
    dialog = within(
      await body.findByRole("dialog", { name: "Delete your data?" }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Delete my data" }),
    );
    await expect(args.onDelete).toHaveBeenCalledOnce();
  },
};

/** While it works, neither button can be pressed again. */
export const Deleting: Story = {
  args: { busy: "delete" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Deleting…" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Download my data" }),
    ).toBeDisabled();
  },
};

export const Links: Story = {
  render: () => ({ components: { LegalLinks }, template: "<LegalLinks />" }),
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole("link");
    await expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/privacy",
      "/terms",
      "/legal",
    ]);
  },
};

export const Storage: Story = {
  render: () => ({
    components: { StorageList },
    setup: () => ({
      items: [
        {
          name: "better-auth.session_token",
          note: "with the prefix __Secure- on https",
          purpose: "Your guest session, set at your first save.",
          lasts: "a year after it was last used",
        },
        { name: "sokobanko:sound", purpose: "Whether sound is on." },
      ],
    }),
    template: '<StorageList :items="items" />',
  }),
};
