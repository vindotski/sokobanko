import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import PlaySettingsMenu from "~/components/PlaySettingsMenu.vue";

/** The play page's ⚙ menu: sound, theme, and the controls help. */
const meta = {
  title: "App/PlaySettingsMenu",
  component: PlaySettingsMenu,
  args: { onHelp: fn() },
  parameters: {
    layout: "fullscreen",
    // While open, the menu holds focus and hides the page from screen
    // readers, trigger included (see UI/DropdownMenu).
    a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
  },
  decorators: [
    () => ({
      template: '<div class="flex h-96 items-end p-8"><story /></div>',
    }),
  ],
} satisfies Meta<typeof PlaySettingsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

/** Open, with Sound turned on from the menu. */
export const Open: Story = {
  play: async ({ canvas }) => {
    localStorage.removeItem("sokobanko:sound");
    await userEvent.click(canvas.getByRole("button", { name: "Settings" }));
    const sound = await within(document.body).findByRole("menuitemcheckbox", {
      name: "Sound",
    });
    await expect(sound).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sound);
    await expect(localStorage.getItem("sokobanko:sound")).toBe("on");
    localStorage.removeItem("sokobanko:sound");
    // The menu closes on a pick; opened again for the docs and screenshot,
    // once it has let go of the page.
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Settings", hidden: true }),
    );
    await within(document.body).findByRole("menu");
  },
};

/** Controls asks the page for the help sheet. */
export const OpensHelp: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Settings" }));
    await userEvent.click(
      await within(document.body).findByRole("menuitem", { name: /Controls/ }),
    );
    await waitFor(() => expect(args.onHelp).toHaveBeenCalledOnce());
  },
};
