import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

const meta = {
  title: "UI/Table",
  component: Table,
  render: () => ({
    components: {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    },
    setup: () => ({
      rows: [
        { title: "Microban 7", moves: 74, pushes: 16 },
        { title: "Microban 6", moves: 147, pushes: 31 },
        { title: "First Push", moves: 5, pushes: 3 },
      ],
    }),
    template: `
      <Table class="w-[28rem]">
        <TableHeader>
          <TableRow>
            <TableHead>Level</TableHead>
            <TableHead class="text-right">Moves</TableHead>
            <TableHead class="text-right">Pushes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in rows" :key="row.title">
            <TableCell class="font-medium">{{ row.title }}</TableCell>
            <TableCell class="text-right font-mono">{{ row.moves }}</TableCell>
            <TableCell class="text-right font-mono">{{ row.pushes }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>`,
  }),
} satisfies Meta<typeof Table>;

export default meta;
export const Bests: StoryObj<typeof meta> = {};
