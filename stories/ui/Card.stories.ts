import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

const meta = {
  title: "UI/Card",
  component: Card,
  render: () => ({
    components: {
      Card,
      CardContent,
      CardDescription,
      CardHeader,
      CardTitle,
      Progress,
    },
    template: `
      <Card class="w-72">
        <CardHeader>
          <CardDescription class="text-label">Solved</CardDescription>
          <CardTitle class="font-mono text-title">20 of 159</CardTitle>
        </CardHeader>
        <CardContent><Progress :model-value="12.6" /></CardContent>
      </Card>`,
  }),
} satisfies Meta<typeof Card>;

export default meta;
export const Stat: StoryObj<typeof meta> = {};
