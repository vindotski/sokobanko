<script setup lang="ts">
import type { GameProgress } from "@sokobanko/game";
import { findLevel } from "~/data/levels";

const route = useRoute();
const level = findLevel(String(route.params.id));
if (!level) {
  throw createError({ statusCode: 404, statusMessage: "Level not found" });
}

const game = useTemplateRef("game");
const progress = ref<GameProgress>({
  moves: 0,
  pushes: 0,
  solution: "",
  solved: false,
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
    <div class="flex items-center gap-2">
      <Button as-child variant="ghost" size="sm">
        <NuxtLink to="/levels">Back</NuxtLink>
      </Button>
      <h1 class="text-2xl font-bold">{{ level.title }}</h1>
      <div class="ml-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="progress.moves === 0"
          @click="game?.undo()"
        >
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="progress.moves === 0"
          @click="game?.restart()"
        >
          Restart
        </Button>
      </div>
    </div>
    <SokobanGame
      ref="game"
      :level="level"
      class="h-[60svh] w-full touch-none select-none"
      @change="progress = $event"
    />
    <p class="text-sm text-muted-foreground">
      <span v-if="progress.solved" class="font-medium text-foreground">
        Solved in {{ progress.moves }} moves and {{ progress.pushes }} pushes!
      </span>
      <template v-else>
        Drag on the board to move.
        {{ progress.moves }} moves, {{ progress.pushes }} pushes
      </template>
    </p>
  </div>
</template>
