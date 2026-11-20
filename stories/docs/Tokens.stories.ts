import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import { onMounted, ref } from "vue";
import LevelPreview from "~/components/LevelPreview.vue";
import { Button } from "~/components/ui/button";

/**
 * The design tokens from app/assets/css/main.css, drawn from the live CSS
 * variables so they can't drift. Switch the Theme toolbar for dark.
 */
const meta = {
  title: "Design/Tokens",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const colourGroups = {
  Surfaces: [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
  ],
  Actions: [
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
  ],
  "Quiet and lines": [
    "muted",
    "muted-foreground",
    "border",
    "input",
    "ring",
    "grid",
  ],
  Board: [
    "board-wall",
    "board-floor",
    "board-goal",
    "board-box",
    "board-box-on-goal",
    "board-player",
  ],
};

/** Every colour token, with its current value. */
export const Colours: Story = {
  render: () => ({
    setup() {
      const values = ref<Record<string, string>>({});
      onMounted(() => {
        const style = getComputedStyle(document.documentElement);
        values.value = Object.fromEntries(
          Object.values(colourGroups)
            .flat()
            .map((name) => [name, style.getPropertyValue(`--${name}`).trim()]),
        );
      });
      return { colourGroups, values };
    },
    template: `
      <div class="flex flex-col gap-8">
        <section v-for="(names, group) in colourGroups" :key="group" class="flex flex-col gap-3">
          <h2 class="text-lead">{{ group }}</h2>
          <ul class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <li v-for="name in names" :key="name" class="flex flex-col gap-1">
              <div class="h-16 border" :style="{ background: 'var(--' + name + ')' }" />
              <code class="text-label">--{{ name }}</code>
              <span class="font-mono text-xs text-muted-foreground">{{ values[name] }}</span>
            </li>
          </ul>
        </section>
      </div>`,
  }),
};

/** The type scale: utilities in main.css, which `cn` knows (app/lib/utils.ts). */
export const Typography: Story = {
  render: () => ({
    setup: () => ({
      scale: [
        ["text-display", "Push every box onto a goal"],
        ["text-section", "Levels"],
        ["text-title", "Microban 7"],
        ["text-lead", "A classic box-pushing puzzle"],
        ["text-body", "You can't pull, so plan ahead."],
        ["text-control", "Undo · Redo · Restart"],
        ["text-small", "Three undos per attempt."],
        ["text-label", "20 of 159 solved"],
      ],
    }),
    template: `
      <div class="flex flex-col gap-5">
        <div v-for="[name, sample] in scale" :key="name" class="flex flex-col gap-1 border-b pb-4">
          <code class="text-label text-muted-foreground">{{ name }}</code>
          <p :class="name">{{ sample }}</p>
        </div>
        <p class="font-mono text-body">Geist Mono: 74 moves · 16 pushes</p>
      </div>`,
  }),
};

/**
 * Controls are 44px tall (h-control) or 36px compact (h-control-compact)
 * with a 44px hit area; corners are square and nothing has a shadow.
 */
export const Sizing: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <Button>h-control · 44px</Button>
          <Button size="sm">h-control-compact · 36px</Button>
        </div>
        <div class="flex items-center gap-4">
          <div class="size-16 border bg-muted" />
          <p class="text-small text-muted-foreground">Radius 0, no shadows: flat, square and black on white.</p>
        </div>
      </div>`,
  }),
};

/**
 * The board's pieces tell themselves apart by shape, not colour: wall, floor,
 * goal (outline), box (frame), box on a goal (tick), a dead box (cross), and
 * the player (diamond).
 */
export const BoardPieces: Story = {
  render: () => ({
    components: { LevelPreview },
    setup: () => ({
      level: {
        id: "pieces",
        title: "Pieces",
        map: ["#######", "#@ $ .#", "#  *  #", "#$    #", "#######"],
      },
    }),
    template: `
      <div class="h-64 w-96 bg-muted p-4"><LevelPreview :level="level" /></div>`,
  }),
};
