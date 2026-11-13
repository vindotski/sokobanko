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

/** Units per cell; pieces use the same 64-unit shapes as drawLevel(). */
const CELL = 64;
/** The gap between tiles, so the board reads as a grid. */
const GAP = 2;

/**
 * One SVG path per kind of tile and piece, so a preview is a handful of
 * elements however big the level is (the gallery shows 159 of them).
 */
const paths = computed(() => {
  const { width, walls, goals, boxes, player } = parsed.value;
  const inside = insideCells(parsed.value);
  const square = (x: number, y: number, at: number, side: number) =>
    `M${x + at} ${y + at}h${side}v${side}h${-side}z`;
  const d = {
    wall: "",
    floor: "",
    goal: "",
    box: "",
    boxCore: "",
    boxOnGoal: "",
    player: "",
  };
  walls.forEach((wall, i) => {
    const x = (i % width) * CELL;
    const y = Math.floor(i / width) * CELL;
    const tile = square(x, y, GAP / 2, CELL - GAP);
    // Cells outside the walls stay empty, so the board reads as an island.
    if (wall) d.wall += tile;
    else if (inside[i]) d.floor += tile;
    if (boxes[i] && goals[i]) d.boxOnGoal += square(x, y, 7, 50);
    else if (boxes[i]) {
      d.box += square(x, y, 10, 44);
      d.boxCore += square(x, y, 26, 12);
    } else if (i === player) {
      d.player += `M${x + 32} ${y + 8}l24 24l-24 24l-24 -24z`;
    } else if (goals[i]) d.goal += square(x, y, 22, 20);
  });
  return d;
});
</script>

<template>
  <svg
    :viewBox="`0 0 ${parsed.width * CELL} ${parsed.height * CELL}`"
    :style="{ aspectRatio: `${parsed.width} / ${parsed.height}`, ...size }"
    aria-hidden="true"
  >
    <!-- Same 64-unit shapes as drawLevel() in packages/game/src/game.ts. -->
    <path :d="paths.wall" class="fill-board-wall" />
    <path :d="paths.floor" class="fill-board-floor" />
    <path :d="paths.goal" stroke-width="3" class="fill-none stroke-board-goal" />
    <path :d="paths.box" stroke-width="6" class="fill-none stroke-board-box" />
    <path :d="paths.boxCore" class="fill-board-box" />
    <path :d="paths.boxOnGoal" class="fill-board-box-on-goal" />
    <path :d="paths.player" class="fill-board-player" />
  </svg>
</template>
