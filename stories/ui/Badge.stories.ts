import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { Badge } from "~/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex flex-wrap gap-2">
        <Badge>New best!</Badge>
        <Badge variant="secondary">Up next</Badge>
        <Badge variant="outline">Not synced yet</Badge>
        <Badge variant="destructive">Refused</Badge>
      </div>`,
  }),
} satisfies Meta<typeof Badge>;

export default meta;
export const Variants: StoryObj<typeof meta> = {};
