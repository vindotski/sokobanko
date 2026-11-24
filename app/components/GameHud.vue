<script setup lang="ts">
import type { GameProgress } from "@sokoban/game";

/**
 * The run at a glance, like a game's HUD: boxes on goals (the goal), moves
 * and pushes, undos left, and your best. A row under the top bar on phones
 * and tablets, a column in the side panel on large screens. Screen readers
 * hear the same through the page's live region, so it stays silent.
 */
defineProps<{
  progress: GameProgress;
  best?: { moves: number; pushes: number };
  layout?: "row" | "column";
}>();
</script>

<template>
  <dl
    aria-hidden="true"
    class="font-mono"
    :class="
      layout === 'column'
        ? 'grid grid-cols-2 gap-3'
        : 'grid grid-cols-4 divide-x text-center'
    "
  >
    <div class="flex flex-col py-2" :class="{ 'border p-3': layout === 'column' }">
      <dt class="font-sans text-label text-muted-foreground">Goals</dt>
      <dd class="text-lead font-semibold">
        {{ progress.boxesOnGoals }}/{{ progress.boxes }}
      </dd>
    </div>
    <div class="flex flex-col py-2" :class="{ 'border p-3': layout === 'column' }">
      <dt class="font-sans text-label text-muted-foreground">Moves</dt>
      <dd class="text-lead font-semibold">
        {{ progress.moves }}<span class="text-small text-muted-foreground"> · {{ progress.pushes }}</span>
      </dd>
    </div>
    <div class="flex flex-col py-2" :class="{ 'border p-3': layout === 'column' }">
      <dt class="font-sans text-label text-muted-foreground">Undos</dt>
      <dd class="text-lead font-semibold">{{ progress.undosLeft }}</dd>
    </div>
    <div class="flex flex-col py-2" :class="{ 'border p-3': layout === 'column' }">
      <dt class="font-sans text-label text-muted-foreground">Best</dt>
      <dd class="text-lead font-semibold">{{ best ? best.moves : "—" }}</dd>
    </div>
  </dl>
</template>
