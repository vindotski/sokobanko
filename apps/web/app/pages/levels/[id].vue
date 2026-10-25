<script setup lang="ts">
import type { GameProgress } from "@sokobanko/game";

const route = useRoute();
const { data } = await useLevel(String(route.params.id));
const level = data.value;
if (!level) {
  throw createError({ statusCode: 404, statusMessage: "Level not found" });
}
const levelId = level.id;

const game = useTemplateRef("game");
const progress = ref<GameProgress>({
  moves: 0,
  pushes: 0,
  solution: "",
  solved: false,
});

type Verification =
  | { state: "idle" | "pending" }
  | { state: "verified"; best: { moves: number; pushes: number } }
  | { state: "failed"; message: string };
const verification = ref<Verification>({ state: "idle" });
const store = useProgressStore();

function onChange(next: GameProgress) {
  progress.value = next;
  if (!next.solved) verification.value = { state: "idle" };
}

// The server replays the solution and records it only if it really solves
// the level.
async function onSolved({ solution }: GameProgress) {
  verification.value = { state: "pending" };
  try {
    const result = await $fetch<{ best: { moves: number; pushes: number } }>(
      `/api/levels/${levelId}/complete`,
      { method: "POST", body: { solution } },
    );
    store.markCompleted(levelId);
    verification.value = { state: "verified", best: result.best };
  } catch (error) {
    const message =
      (error as { data?: { message?: string } }).data?.message ??
      "Could not save your result";
    verification.value = { state: "failed", message };
  }
}
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
      @change="onChange"
      @solved="onSolved"
    />
    <p class="text-sm text-muted-foreground">
      <template v-if="progress.solved">
        <span class="font-medium text-foreground">
          Solved in {{ progress.moves }} moves and {{ progress.pushes }} pushes!
        </span>
        <template v-if="verification.state === 'pending'"> Saving…</template>
        <template v-else-if="verification.state === 'verified'">
          Your best: {{ verification.best.moves }} moves.
        </template>
        <span
          v-else-if="verification.state === 'failed'"
          class="text-destructive"
        >
          Not saved: {{ verification.message }}
        </span>
      </template>
      <template v-else>
        Drag on the board or use the arrow keys.
        {{ progress.moves }} moves, {{ progress.pushes }} pushes
      </template>
    </p>
  </div>
</template>
