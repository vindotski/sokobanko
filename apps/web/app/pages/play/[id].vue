<script setup lang="ts">
import {
  ArrowLeftIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  Undo2Icon,
} from "@lucide/vue";
import type { GameProgress, OverviewState } from "@sokobanko/game";

definePageMeta({ layout: "play" });

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
const overview = ref<OverviewState>({ available: false, active: false });

type Verification =
  | { state: "idle" | "pending" }
  | { state: "verified"; best: { moves: number; pushes: number } }
  | { state: "failed"; message: string };
const verification = ref<Verification>({ state: "idle" });
const store = useProgressStore();

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

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
    store.markCompleted(levelId, result.best);
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
  <div class="flex flex-1 flex-col">
    <div class="border-b">
      <div class="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
        <Button as-child variant="ghost" size="icon-sm">
          <NuxtLink to="/levels" aria-label="Back to levels">
            <ArrowLeftIcon />
          </NuxtLink>
        </Button>
        <!-- Title above the counts, so neither competes with the buttons. -->
        <div class="flex min-w-0 flex-1 flex-col">
          <h1 class="truncate text-sm font-semibold">{{ level.title }}</h1>
          <p class="truncate text-xs text-muted-foreground tabular-nums">
            {{ count(progress.moves, "move", "moves") }} ·
            {{ count(progress.pushes, "push", "pushes") }}
          </p>
        </div>
        <Toggle
          v-if="overview.available"
          variant="outline"
          size="sm"
          :model-value="overview.active"
          @update:model-value="game?.setOverview($event)"
        >
          <ScanSearchIcon data-icon="inline-start" />
          <span class="sr-only sm:not-sr-only">Overview</span>
        </Toggle>
        <Button
          variant="outline"
          size="sm"
          :disabled="progress.moves === 0"
          @click="game?.undo()"
        >
          <Undo2Icon data-icon="inline-start" />
          <span class="sr-only sm:not-sr-only">Undo</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="progress.moves === 0"
          @click="game?.restart()"
        >
          <RotateCcwIcon data-icon="inline-start" />
          <span class="sr-only sm:not-sr-only">Restart</span>
        </Button>
      </div>
    </div>

    <div class="relative flex-1 bg-muted bg-tile-grid [--tile-grid-size:24px]">
      <div class="absolute inset-0">
        <SokobanGame
          ref="game"
          :level="level"
          :padding="{ bottom: 96 }"
          class="size-full touch-none select-none"
          @change="onChange"
          @solved="onSolved"
          @overview="overview = $event"
        />
      </div>

      <!-- Clicks and drags pass through to the board. -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4"
      >
        <Item
          v-if="progress.solved"
          variant="outline"
          size="sm"
          class="bg-background"
        >
          <ItemContent>
            <ItemTitle>
              Solved in {{ count(progress.moves, "move", "moves") }}!
            </ItemTitle>
            <ItemDescription v-if="verification.state === 'pending'">
              Saving…
            </ItemDescription>
            <ItemDescription v-else-if="verification.state === 'verified'">
              Best: {{ count(verification.best.moves, "move", "moves") }}
            </ItemDescription>
            <ItemDescription
              v-else-if="verification.state === 'failed'"
              class="text-destructive"
            >
              Not saved: {{ verification.message }}
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item
          v-else-if="progress.moves === 0"
          variant="outline"
          size="sm"
          class="bg-background"
        >
          <ItemContent>
            <ItemDescription>
              Drag the board or use arrow keys / WASD
              <!-- Phones have no Space key; they use the Overview toggle. -->
              <span v-if="overview.available" class="hidden sm:inline">
                · hold Space for overview
              </span>
            </ItemDescription>
          </ItemContent>
        </Item>
      </div>
    </div>
  </div>
</template>
