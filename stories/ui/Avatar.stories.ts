import { UserIcon } from "@lucide/vue";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";

const meta = {
  title: "UI/Avatar and Separator",
  component: Avatar,
  render: () => ({
    components: { Avatar, AvatarFallback, Separator, UserIcon },
    template: `
      <div class="flex h-12 items-center gap-4">
        <Avatar class="size-12"><AvatarFallback><UserIcon /></AvatarFallback></Avatar>
        <Separator orientation="vertical" />
        <span class="text-title">Guest</span>
      </div>`,
  }),
} satisfies Meta<typeof Avatar>;

export default meta;
export const Guest: StoryObj<typeof meta> = {};
