<script setup lang="ts">
import type { LevelState } from "@sokobanko/core";
import { useElementSize } from "@vueuse/core";

/**
 * A collection's levels as a winding path, as wide as fits, in play order
 * (utils/levelPath.ts). The nodes are links in that order, so keyboard and
 * screen-reader users meet them one after another.
 */
const props = defineProps<{
  levels: { id: string; title: string; number: number }[];
  states: Record<string, LevelState>;
  best: Record<string, { moves: number }>;
}>();

const SIZE = 56;
const PITCH = 80;
// As many levels per row as fit, from 4 (a phone) to 10. The server, and the
// first render in the browser, use 4; then the path fits its space.
const box = useTemplateRef("box");
const { width: available } = useElementSize(box);
const columns = computed(() =>
  available.value
    ? Math.min(
        10,
        Math.max(4, Math.floor((available.value + PITCH - SIZE) / PITCH)),
      )
    : 4,
);
const cells = computed(() => pathCells(props.levels.length, columns.value));
const rows = computed(() => Math.ceil(props.levels.length / columns.value));
const width = computed(() => columns.value * PITCH - (PITCH - SIZE));
const height = computed(() => Math.max(rows.value * PITCH - (PITCH - SIZE), 0));
const line = computed(() => pathLine(cells.value, PITCH, SIZE));
</script>

<template>
  <div ref="box" class="w-full">
  <ol
    class="relative mx-auto"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <svg
      class="pointer-events-none absolute inset-0 text-border"
      :width="width"
      :height="height"
      aria-hidden="true"
    >
      <polyline
        :points="line"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
    </svg>
    <li
      v-for="(level, i) in levels"
      :key="level.id"
      class="absolute"
      :style="{
        left: `${(cells[i]?.col ?? 0) * PITCH}px`,
        top: `${(cells[i]?.row ?? 0) * PITCH}px`,
      }"
    >
      <LevelNode
        :level="level"
        :state="states[level.id]"
        :best="best[level.id]"
      />
    </li>
  </ol>
  </div>
</template>
