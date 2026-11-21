import type { LegalFacts } from "@kodentuzo/spotkit";
import { privacyPolicy } from "@kodentuzo/spotstrap/blocks";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent, within } from "storybook/test";
import LegalDocument from "~/components/LegalDocument.vue";
import LegalLinks from "~/components/LegalLinks.vue";
import YourData from "~/components/YourData.vue";

/**
 * Privacy: Progress → Your data (Spotstrap's YourData block), the links to
 * the legal pages, and the privacy policy rendered from legal facts.
 */
const meta = {
  title: "App/Legal",
  component: YourData,
  args: { appName: "Sokobanko" },
} satisfies Meta<typeof YourData>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Deleting asks first, and Cancel leaves everything as it was. */
export const YourDataBlock: Story = {
  name: "Your data",
  decorators: [() => ({ template: '<div class="w-[24rem]"><story /></div>' })],
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Download your data" }),
    ).toBeEnabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete your data" }),
    );
    const dialog = within(
      await within(document.body).findByRole("alertdialog", {
        name: "Delete your data?",
      }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await expect(
      await canvas.findByRole("button", { name: "Delete your data" }),
    ).toBeEnabled();
  },
};

export const Links: Story = {
  decorators: [() => ({ template: '<div class="w-[24rem]"><story /></div>' })],
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

/** Example facts, shaped like Spotcraft's; not anyone's real details. */
const facts: LegalFacts = {
  version: 1,
  updated: "2026-11-21",
  controller: {
    name: "Ana Example",
    address: ["Example Street 1", "10430 Samobor", "Croatia"],
    email: "privacy@example.test",
    authority: { name: "AZOP", url: "https://azop.hr" },
  },
  processing: [
    {
      id: "hosting",
      basis: "contract",
      retentionDays: null,
      processor: { name: "Hetzner Online GmbH", country: "DE" },
    },
    { id: "accounts", basis: "contract", retentionDays: 180 },
  ],
};

export const PrivacyPolicy: Story = {
  decorators: [() => ({ template: '<div class="w-[40rem]"><story /></div>' })],
  render: () => ({
    components: { LegalDocument },
    setup: () => ({
      doc: privacyPolicy(facts, {
        appName: "Sokobanko",
        appData: [
          {
            what: "Your result for each level",
            why: "so your progress is yours",
            kept: "until you delete your data",
          },
        ],
      }),
    }),
    template: '<LegalDocument :doc="doc" />',
  }),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Who is responsible" }),
    ).toBeVisible();
    // Who is responsible, and where to write about your rights.
    const emails = canvas.getAllByRole("link", {
      name: "privacy@example.test",
    });
    await expect(emails).toHaveLength(2);
    for (const email of emails) {
      await expect(email).toHaveAttribute(
        "href",
        "mailto:privacy@example.test",
      );
    }
  },
};
