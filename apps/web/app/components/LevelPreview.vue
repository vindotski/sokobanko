<script setup lang="ts">
import { insideCells, type LevelJson, parseLevel } from "@sokoban/core";

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

type Piece = "goal" | "box" | "boxOnGoal" | "player";

const cells = computed(() => {
  const { walls, goals, boxes, player } = parsed.value;
  const inside = insideCells(parsed.value);
  return Array.from(walls, (_, i) => {
    // Cells outside the walls stay empty, so the board reads as an island.
    const tile = walls[i] ? "bg-board-wall" : inside[i] ? "bg-board-floor" : "";
    let piece: Piece | null = null;
    if (boxes[i]) piece = goals[i] ? "boxOnGoal" : "box";
    else if (i === player) piece = "player";
    else if (goals[i]) piece = "goal";
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
      <!-- Same 64-unit shapes as drawLevel() in packages/game/src/game.ts. -->
      <svg v-if="cell.piece" viewBox="0 0 64 64" class="size-full">
        <rect
          v-if="cell.piece === 'boxOnGoal'"
          x="7"
          y="7"
          width="50"
          height="50"
          class="fill-board-box-on-goal"
        />
        <template v-else-if="cell.piece === 'box'">
          <rect
            x="10"
            y="10"
            width="44"
            height="44"
            stroke-width="6"
            class="fill-none stroke-board-box"
          />
          <rect x="26" y="26" width="12" height="12" class="fill-board-box" />
        </template>
        <polygon
          v-else-if="cell.piece === 'player'"
          points="32,8 56,32 32,56 8,32"
          class="fill-board-player"
        />
        <rect
          v-else
          x="22"
          y="22"
          width="20"
          height="20"
          stroke-width="3"
          class="fill-none stroke-board-goal"
        />
      </svg>
    </div>
  </div>
</template>
