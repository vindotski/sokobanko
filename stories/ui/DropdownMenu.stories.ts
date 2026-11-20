import { SettingsIcon } from "@lucide/vue";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "fullscreen" },
  render: () => ({
    components: {
      Button,
      DropdownMenu,
      DropdownMenuCheckboxItem,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuRadioGroup,
      DropdownMenuRadioItem,
      DropdownMenuSeparator,
      DropdownMenuShortcut,
      DropdownMenuTrigger,
      SettingsIcon,
    },
    setup: () => ({ sound: ref(true), theme: ref("system") }),
    template: `
      <div class="p-8">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon-sm" aria-label="Settings"><SettingsIcon /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuCheckboxItem v-model="sound">Sound</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup v-model="theme">
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Controls <DropdownMenuShortcut>?</DropdownMenuShortcut></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>`,
  }),
} satisfies Meta<typeof DropdownMenu>;

export default meta;

/** Opens from the keyboard; checkbox and radio items keep their state. */
export const Keyboard: StoryObj<typeof meta> = {
  parameters: {
    a11y: {
      config: {
        // While the menu is open it holds focus, and reka-ui hides the rest
        // of the page from screen readers, trigger included; axe flags the
        // hidden trigger as focusable although focus can't reach it.
        rules: [{ id: "aria-hidden-focus", enabled: false }],
      },
    },
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Settings" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const body = within(document.body);
    const menu = await body.findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    await expect(
      body.getByRole("menuitemcheckbox", { name: "Sound" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      body.getByRole("menuitemradio", { name: "System" }),
    ).toHaveAttribute("aria-checked", "true");
  },
};
