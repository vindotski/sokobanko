import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent, within } from "storybook/test";
import SettingsSheet from "~/components/SettingsSheet.vue";

/** Theme and sound, with the way to the controls, About and the legal pages. */
const meta = {
  title: "App/Settings",
  component: SettingsSheet,
  parameters: { layout: "fullscreen" },
  render: () => ({
    components: { SettingsSheet },
    setup() {
      useSettingsOpen().value = true;
    },
    template: "<SettingsSheet />",
  }),
} satisfies Meta<typeof SettingsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sound is a switch; it remembers the choice. */
export const Open: Story = {
  play: async () => {
    localStorage.removeItem("sokoban:sound");
    const sheet = within(
      await within(document.body).findByRole("dialog", { name: "Settings" }),
    );
    const sound = sheet.getByRole("switch", { name: "Sound" });
    await expect(sound).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sound);
    await expect(sound).toHaveAttribute("aria-checked", "true");
    await userEvent.click(sound);
    localStorage.removeItem("sokoban:sound");
    // And the way to the legal pages.
    await expect(
      within(sheet.getByRole("navigation", { name: "Legal" })).getAllByRole(
        "link",
      ),
    ).toHaveLength(3);
  },
};

export const Phone: Story = { globals: { viewport: { value: "phone" } } };
