import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import SiteFooter from "~/components/SiteFooter.vue";
import SiteHeader from "~/components/SiteHeader.vue";
import ThemeToggle from "~/components/ThemeToggle.vue";

/** The site's frame around Home, Levels, the FAQ and the profile. */
const meta = {
  title: "App/Site",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {};
export const HeaderOnPhone: Story = {
  globals: { viewport: { value: "phone" } },
};

export const Footer: Story = {
  render: () => ({ components: { SiteFooter }, template: "<SiteFooter />" }),
};

export const ThemeMenu: Story = {
  parameters: { layout: "centered" },
  render: () => ({ components: { ThemeToggle }, template: "<ThemeToggle />" }),
};
