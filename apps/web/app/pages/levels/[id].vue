<script setup lang="ts">
import type { Direction } from "@sokobanko/core";
import { findLevel } from "~/data/levels";

const route = useRoute();
const level = findLevel(String(route.params.id));
if (!level) {
  throw createError({ statusCode: 404, statusMessage: "Level not found" });
}

// Placeholder until core can apply moves.
const moves = ref<Direction[]>([]);
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
    <div class="flex items-center gap-2">
      <Button as-child variant="ghost" size="sm">
        <NuxtLink to="/levels">Back</NuxtLink>
      </Button>
      <h1 class="text-2xl font-bold">{{ level.title }}</h1>
      <Button variant="outline" size="sm" class="ml-auto" disabled>
        Restart
      </Button>
    </div>
    <SokobanGame
      :level="level"
      class="h-[60svh] w-full touch-none select-none"
      @move="moves.push($event)"
    />
    <p class="text-sm text-muted-foreground">
      Drag on the board to move.
      <span v-if="moves.length" class="font-mono">{{ moves.join("") }}</span>
    </p>
  </div>
</template>
