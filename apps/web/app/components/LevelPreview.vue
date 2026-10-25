<script setup lang="ts">
import { type LevelJson, parseLevel } from "@sokobanko/core";

const props = defineProps<{ level: LevelJson }>();

const parsed = computed(() => parseLevel(props.level));

const cells = computed(() => {
  const { walls, goals, boxes, player } = parsed.value;
  return Array.from(walls, (_, i) => {
    if (walls[i]) return "bg-zinc-600";
    if (boxes[i]) {
      return `scale-80 rounded-sm ${goals[i] ? "bg-green-600" : "bg-amber-700"}`;
    }
    if (i === player) return "rounded-full bg-blue-500";
    if (goals[i]) return "scale-50 rounded-full bg-amber-500";
    return "";
  });
});
</script>

<template>
  <div
    class="grid"
    :style="{
      gridTemplateColumns: `repeat(${parsed.width}, 1fr)`,
      aspectRatio: `${parsed.width} / ${parsed.height}`,
    }"
  >
    <div v-for="(cell, i) in cells" :key="i" :class="cell" />
  </div>
</template>
