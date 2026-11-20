import { CheckIcon } from "@lucide/vue";
import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";

const meta = {
  title: "UI/Item",
  component: Item,
  render: () => ({
    components: {
      CheckIcon,
      Item,
      ItemActions,
      ItemContent,
      ItemDescription,
      ItemMedia,
      ItemTitle,
    },
    template: `
      <Item variant="outline" class="w-96">
        <ItemMedia><CheckIcon /></ItemMedia>
        <ItemContent>
          <ItemTitle>Microban 1</ItemTitle>
          <ItemDescription>33 moves · 8 pushes</ItemDescription>
        </ItemContent>
        <ItemActions><span class="text-label text-muted-foreground">Solved</span></ItemActions>
      </Item>`,
  }),
} satisfies Meta<typeof Item>;

export default meta;
export const Level: StoryObj<typeof meta> = {};
