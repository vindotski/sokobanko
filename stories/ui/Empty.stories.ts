import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";

const meta = {
  title: "UI/Empty",
  component: Empty,
  render: () => ({
    components: {
      Button,
      Empty,
      EmptyContent,
      EmptyDescription,
      EmptyHeader,
      EmptyTitle,
    },
    template: `
      <Empty class="w-96 border">
        <EmptyHeader>
          <EmptyTitle>No levels solved yet</EmptyTitle>
          <EmptyDescription>Solve a level and your best result shows up here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button>Browse levels</Button></EmptyContent>
      </Empty>`,
  }),
} satisfies Meta<typeof Empty>;

export default meta;
export const NothingYet: StoryObj<typeof meta> = {};
