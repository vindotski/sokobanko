<script setup lang="ts">
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  PlayIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  TrophyIcon,
  Undo2Icon,
} from "@lucide/vue";
import { levelStates } from "@sokoban/core";
import type { GameProgress, OverviewState } from "@sokoban/game";
import { usePreferredReducedMotion } from "@vueuse/core";

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
// Neighbours in play order, solved or not. Plain indexing, unlike `.at()`,
// gives no previous level for the first one rather than wrapping around.
const levelIndex = computed(() =>
  (levels.value ?? []).findIndex((l) => l.id === levelId),
);
const prevLevel = computed(() => levels.value?.[levelIndex.value - 1]);
const nextLevel = computed(() => levels.value?.[levelIndex.value + 1]);

// Levels unlock in play order; the server enforces the same rule.
const states = computed(() =>
  levelStates(
    (levels.value ?? []).map((l) => l.id),
    (id) => id in store.best,
  ),
);
const isLocked = computed(() => states.value.get(levelId) === "locked");
const nextLocked = computed(
  () => !!nextLevel.value && states.value.get(nextLevel.value.id) === "locked",
);
/** The level to solve to unlock this one. */
const currentLevel = computed(() =>
  levels.value?.find((l) => states.value.get(l.id) === "current"),
);

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

// The board bursts into sparks on a solve; the dialog opens once they've
// mostly faded. Same length as CELEBRATION_MS in packages/game, which isn't
// imported here because that would pull PixiJS into the server bundle.
const CELEBRATION_MS = 900;
const reducedMotion = usePreferredReducedMotion();
let dialogTimer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(dialogTimer));

function onChange(next: GameProgress) {
  progress.value = next;
  if (!next.solved) {
    // An undo or restart during the burst cancels the dialog.
    clearTimeout(dialogTimer);
    verification.value = { state: "idle" };
  }
}

// The server replays the solution and records it only if it really solves
// the level.
async function onSolved({ solution, moves, pushes }: GameProgress) {
  run.value = { moves, pushes };
  const previousBest = store.best[levelId];
  isNewBest.value = false;
  clearTimeout(dialogTimer);
  dialogTimer = setTimeout(
    () => {
      solvedOpen.value = true;
    },
    reducedMotion.value === "reduce" ? 0 : CELEBRATION_MS,
  );
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
      <!--
        Three columns, like the bottom toolbar, so the title stays centred.
        On the first level Prev is disabled rather than hidden, so nothing
        shifts; Next is disabled while the next level is locked, and on the
        last level it becomes Finish.
      -->
      <div
        class="mx-auto grid h-12 w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4"
      >
        <Button
          v-if="prevLevel"
          variant="ghost"
          size="sm"
          class="justify-self-start"
          as-child
        >
          <NuxtLink :to="`/play/${prevLevel.id}`" aria-label="Previous level">
            <ChevronLeftIcon data-icon="inline-start" />
            <span class="sr-only sm:not-sr-only">Prev</span>
          </NuxtLink>
        </Button>
        <Button
          v-else
          variant="ghost"
          size="sm"
          class="justify-self-start"
          aria-label="Previous level"
          disabled
        >
          <ChevronLeftIcon data-icon="inline-start" />
          <span class="sr-only sm:not-sr-only">Prev</span>
        </Button>

        <h1 class="min-w-0 truncate text-center text-sm font-semibold">
          {{ level.title }}
        </h1>

        <Button
          v-if="nextLocked"
          variant="ghost"
          size="sm"
          class="justify-self-end"
          aria-label="Next level (locked)"
          disabled
        >
          <span class="sr-only sm:not-sr-only">Next</span>
          <LockIcon data-icon="inline-end" />
        </Button>
        <Button
          v-else-if="nextLevel"
          variant="ghost"
          size="sm"
          class="justify-self-end"
          as-child
        >
          <NuxtLink :to="`/play/${nextLevel.id}`" aria-label="Next level">
            <span class="sr-only sm:not-sr-only">Next</span>
            <ChevronRightIcon data-icon="inline-end" />
          </NuxtLink>
        </Button>
        <!--
          The last level: Finish waits until it's solved, then /play
          congratulates once every level is.
        -->
        <Button
          v-else-if="!(levelId in store.best)"
          variant="ghost"
          size="sm"
          class="justify-self-end"
          aria-label="Finish"
          disabled
        >
          <span class="sr-only sm:not-sr-only">Finish</span>
          <TrophyIcon data-icon="inline-end" />
        </Button>
        <Button
          v-else
          variant="ghost"
          size="sm"
          class="justify-self-end"
          as-child
        >
          <NuxtLink to="/play" aria-label="Finish">
            <span class="sr-only sm:not-sr-only">Finish</span>
            <TrophyIcon data-icon="inline-end" />
          </NuxtLink>
        </Button>
      </div>
    </div>

    <div class="relative flex-1 bg-muted bg-tile-grid [--tile-grid-size:24px]">
      <!-- No game on a locked level, so there's nothing to play or record. -->
      <div
        v-if="isLocked"
        class="absolute inset-0 flex items-center justify-center px-4 py-8"
      >
        <!-- A solid card keeps the text readable over the grid. -->
        <Card class="w-full max-w-md py-8">
          <CardContent>
            <Empty class="p-0 md:p-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LockIcon />
                </EmptyMedia>
                <EmptyTitle>This level is locked</EmptyTitle>
                <EmptyDescription v-if="currentLevel">
                  Solve {{ currentLevel.title }} to unlock it.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent v-if="currentLevel">
                <Button as-child>
                  <NuxtLink :to="`/play/${currentLevel.id}`">
                    <PlayIcon data-icon="inline-start" />
                    Play {{ currentLevel.title }}
                  </NuxtLink>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>

      <template v-else>
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
              class="min-w-0 max-w-48 truncate text-center font-mono text-sm text-muted-foreground sm:max-w-sm"
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
      </template>
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
              <CardDescription class="text-label">This run</CardDescription>
              <CardTitle class="font-mono text-title">
                {{ count(run.moves, "move", "moves") }}
              </CardTitle>
              <p class="font-mono text-sm text-muted-foreground">
                {{ count(run.pushes, "push", "pushes") }}
              </p>
            </CardHeader>
          </Card>
          <Card class="gap-1 py-4">
            <CardHeader class="px-4">
              <CardDescription class="text-label">Your best</CardDescription>
              <template v-if="verification.state === 'verified'">
                <CardTitle class="font-mono text-title">
                  {{ count(verification.best.moves, "move", "moves") }}
                </CardTitle>
                <p class="font-mono text-sm text-muted-foreground">
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
          <!--
            The next level unlocks once this result is saved, so this waits
            for the save, or stays disabled if it failed.
          -->
          <Button v-if="nextLocked" disabled>
            Next level
            <LockIcon data-icon="inline-end" />
          </Button>
          <Button v-else-if="nextLevel" as-child>
            <NuxtLink :to="`/play/${nextLevel.id}`">
              Next level
              <ArrowRightIcon data-icon="inline-end" />
            </NuxtLink>
          </Button>
          <!--
            The last level. Wait for the save, or /play wouldn't count this
            level as solved yet.
          -->
          <Button v-else-if="verification.state === 'pending'" disabled>
            <TrophyIcon data-icon="inline-start" />
            Finish
          </Button>
          <Button v-else as-child>
            <NuxtLink to="/play">
              <TrophyIcon data-icon="inline-start" />
              Finish
            </NuxtLink>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
