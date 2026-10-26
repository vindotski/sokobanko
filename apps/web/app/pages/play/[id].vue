<script setup lang="ts">
import {
  ArrowRightIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  TrophyIcon,
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
const user = useSupabaseUser();
const { data: levels } = await useLevels();
// Completions, so "New best!" knows the previous best even on a direct visit.
await useAsyncData("completions", () => store.load(), {
  watch: [() => user.value?.sub],
});

// Completion dialog: this run's numbers, and whether they beat the old best.
const solvedOpen = ref(false);
const run = ref({ moves: 0, pushes: 0 });
const isNewBest = ref(false);
/** The level right after this one in play order, solved or not. */
const nextLevel = computed(() => {
  const all = levels.value ?? [];
  return all[all.findIndex((l) => l.id === levelId) + 1];
});

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function onChange(next: GameProgress) {
  progress.value = next;
  if (!next.solved) verification.value = { state: "idle" };
}

// The server replays the solution and records it only if it really solves
// the level.
async function onSolved({ solution, moves, pushes }: GameProgress) {
  run.value = { moves, pushes };
  const previousBest = store.best[levelId];
  isNewBest.value = false;
  solvedOpen.value = true;
  verification.value = { state: "pending" };
  try {
    const result = await $fetch<{ best: { moves: number; pushes: number } }>(
      `/api/levels/${levelId}/complete`,
      { method: "POST", body: { solution } },
    );
    store.markCompleted(levelId, result.best);
    verification.value = { state: "verified", best: result.best };
    isNewBest.value = !previousBest || moves < previousBest.moves;
  } catch (error) {
    const message =
      (error as { data?: { message?: string } }).data?.message ??
      "Could not save your result";
    verification.value = { state: "failed", message };
  }
}

function replay() {
  solvedOpen.value = false;
  game.value?.restart();
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="border-b">
      <div class="mx-auto flex h-12 w-full max-w-5xl items-center px-4">
        <h1 class="w-full truncate text-center text-sm font-semibold">
          {{ level.title }}
        </h1>
      </div>
    </div>

    <div class="relative flex-1 bg-muted bg-tile-grid [--tile-grid-size:24px]">
      <div class="absolute inset-0">
        <SokobanGame
          ref="game"
          :level="level"
          :padding="{ bottom: 136 }"
          class="size-full touch-none select-none"
          @change="onChange"
          @solved="onSolved"
          @overview="overview = $event"
        />
      </div>

      <!-- Above the toolbar; clicks and drags pass through to the board. -->
      <div
        v-if="!progress.solved && progress.moves === 0"
        class="pointer-events-none absolute inset-x-0 bottom-18 flex justify-center px-4"
      >
        <Item variant="outline" size="sm" class="bg-background">
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

      <!-- Three columns, so the status stays centred whatever the sides hold. -->
      <div class="absolute inset-x-0 bottom-0 border-t bg-background">
        <div
          class="mx-auto grid h-14 w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4"
        >
          <div class="flex gap-2">
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

          <p
            class="min-w-0 max-w-48 truncate text-center text-sm text-muted-foreground tabular-nums sm:max-w-sm"
          >
            {{ count(progress.moves, "move", "moves") }} ·
            {{ count(progress.pushes, "push", "pushes") }}
          </p>

          <Toggle
            variant="outline"
            size="sm"
            class="justify-self-end"
            :disabled="!overview.available"
            :model-value="overview.active"
            @update:model-value="game?.setOverview($event)"
          >
            <ScanSearchIcon data-icon="inline-start" />
            <span class="sr-only sm:not-sr-only">Overview</span>
          </Toggle>
        </div>
      </div>
    </div>

    <Dialog v-model:open="solvedOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <!-- Centred on phones, like the rest of the dialog header. -->
          <div class="flex items-center justify-center gap-2 sm:justify-start">
            <TrophyIcon class="size-5" />
            <DialogTitle>Level solved!</DialogTitle>
            <Badge v-if="isNewBest">New best!</Badge>
          </div>
          <DialogDescription>{{ level.title }}</DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-2 gap-3">
          <Card class="gap-1 py-4">
            <CardHeader class="px-4">
              <CardDescription>This run</CardDescription>
              <CardTitle class="text-xl tabular-nums">
                {{ count(run.moves, "move", "moves") }}
              </CardTitle>
              <p class="text-sm text-muted-foreground tabular-nums">
                {{ count(run.pushes, "push", "pushes") }}
              </p>
            </CardHeader>
          </Card>
          <Card class="gap-1 py-4">
            <CardHeader class="px-4">
              <CardDescription>Your best</CardDescription>
              <template v-if="verification.state === 'verified'">
                <CardTitle class="text-xl tabular-nums">
                  {{ count(verification.best.moves, "move", "moves") }}
                </CardTitle>
                <p class="text-sm text-muted-foreground tabular-nums">
                  {{ count(verification.best.pushes, "push", "pushes") }}
                </p>
              </template>
              <p
                v-else-if="verification.state === 'failed'"
                class="text-sm text-destructive"
              >
                Not saved: {{ verification.message }}
              </p>
              <p v-else class="text-sm text-muted-foreground">Saving…</p>
            </CardHeader>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="replay">
            <RotateCcwIcon data-icon="inline-start" />
            Replay
          </Button>
          <!-- Hidden on the last level: there is no next one. -->
          <Button v-if="nextLevel" as-child>
            <NuxtLink :to="`/play/${nextLevel.id}`">
              Next level
              <ArrowRightIcon data-icon="inline-end" />
            </NuxtLink>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
