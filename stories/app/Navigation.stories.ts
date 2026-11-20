import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect } from "storybook/test";
import AppSidebar from "~/components/AppSidebar.vue";
import AppTabBar from "~/components/AppTabBar.vue";
import PageHeader from "~/components/PageHeader.vue";

/**
 * The app's sections: a tab bar on phones (Apple's HIG: navigation, not
 * actions, always visible), a rail on tablets and a sidebar on desktops.
 */
const meta = {
  title: "App/Navigation",
  component: AppTabBar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TabBar: Story = {
  globals: { viewport: { value: "phone" } },
  render: () => ({
    components: { AppTabBar, PageHeader },
    template:
      '<div class="h-dvh"><PageHeader title="Progress" /><AppTabBar /></div>',
  }),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Sections" });
    await expect(nav).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Play" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      canvas.getByRole("button", { name: "Settings" }),
    ).toBeVisible();
  },
};

/** From md: a rail, with labels under the icons. */
export const Rail: Story = {
  globals: { viewport: { value: "tablet" } },
  render: () => ({ components: { AppSidebar }, template: "<AppSidebar />" }),
};

/** From lg: the full sidebar. */
export const Sidebar: Story = {
  globals: { viewport: { value: "desktop" } },
  render: () => ({ components: { AppSidebar }, template: "<AppSidebar />" }),
};
