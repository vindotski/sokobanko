<script setup lang="ts">
import { insideCells, type LevelJson, parseLevel } from "@sokobanko/core";

const props = withDefaults(
  defineProps<{
    level: LevelJson;
    /** Aspect ratio of the box the preview is fitted into. */
    frameAspect?: number;
  }>(),
  { frameAspect: 4 / 3 },
);

const parsed = computed(() => parseLevel(props.level));

// Fill the frame's width if the board is wider than it, otherwise its height.
const size = computed(() =>
  parsed.value.width / parsed.value.height > props.frameAspect
    ? { width: "100%" }
    : { height: "100%" },
);

const cells = computed(() => {
  const { walls, goals, boxes, player } = parsed.value;
  const inside = insideCells(parsed.value);
  return Array.from(walls, (_, i) => {
    // Cells outside the walls stay empty, so the board reads as an island.
    const tile = walls[i]
      ? "rounded-[1px] bg-board-wall"
      : inside[i]
        ? "bg-board-floor"
        : "";
    let piece = "";
    if (boxes[i]) {
      piece = goals[i]
        ? "size-[80%] rounded-[20%] bg-board-box-on-goal"
        : "size-[80%] rounded-[20%] bg-board-box";
    } else if (i === player) {
      piece = "size-[70%] rounded-full bg-board-player";
    } else if (goals[i]) {
      piece = "size-[35%] rounded-full bg-board-goal";
    }
    return { tile, piece };
  });
});
</script>

<template>
  <div
    class="grid gap-px"
    :style="{
      gridTemplateColumns: `repeat(${parsed.width}, 1fr)`,
      gridTemplateRows: `repeat(${parsed.height}, 1fr)`,
      aspectRatio: `${parsed.width} / ${parsed.height}`,
      ...size,
    }"
  >
    <div
      v-for="(cell, i) in cells"
      :key="i"
      class="flex items-center justify-center"
      :class="cell.tile"
    >
      <div v-if="cell.piece" :class="cell.piece" />
    </div>
  </div>
</template>
