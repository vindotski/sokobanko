<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  LockIcon,
  PlayIcon,
  Redo2Icon,
  RotateCcwIcon,
  TrophyIcon,
  Undo2Icon,
} from "@lucide/vue";
import { isBetter, levelStates, UNDO_BUDGET } from "@sokoban/core";
import type { CameraState, GameProgress } from "@sokoban/game";
import { onKeyStroke, usePreferredReducedMotion } from "@vueuse/core";

definePageMeta({ layout: "game" });

const route = useRoute();
const { data: levels } = await useLevels();
const level = levels.value?.find((l) => l.id === route.params.id);
if (!level) {
  throw createError({ statusCode: 404, statusMessage: "Level not found" });
}
const levelId = level.id;
// The collection and its author, under the title.
const { data: collections } = await useCollections();
const collection = computed(() =>
  collections.value?.find((c) => c.id === level.collection),
);
/** How many levels the collection has, for "8 of 155". */
const collectionSize = computed(
  () => levels.value?.filter((l) => l.collection === level.collection).length,
);

// A half-played run is kept in the browser, so a reload or a visit to
// another level doesn't lose it. Storage can be missing or blocked (private
// windows), in which case runs simply aren't kept. Read on the client only:
// the server renders a fresh board either way.
const runKey = `sokobanko:run:${levelId}`;
function readRun() {
  try {
    return localStorage.getItem(runKey) ?? undefined;
  } catch {
    return undefined;
  }
}
function saveRun({ log, solved }: GameProgress) {
  try {
    // Nothing to resume at the start, or once solved.
    if (log && !solved) localStorage.setItem(runKey, log);
    else localStorage.removeItem(runKey);
  } catch {}
}
const savedRun = import.meta.client ? readRun() : undefined;

const game = useTemplateRef("game");
const progress = ref<GameProgress>({
  moves: 0,
  pushes: 0,
  solution: "",
  log: "",
  undosLeft: UNDO_BUDGET,
  solved: false,
  canRedo: false,
  boxes: 0,
  boxesOnGoals: 0,
  deadBoxes: 0,
});
const camera = ref<CameraState>({
  canZoomIn: true,
  canZoomOut: false,
  fitted: true,
  following: true,
});

// The controls help: from Settings, or the ? key anywhere but a text field
// or another dialog.
const helpOpen = ref(false);
// The level picker, opened from the level's name.
const switcherOpen = ref(false);
onKeyStroke("?", (e) => {
  const target = e.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) ||
      target.closest('[role="dialog"]'))
  ) {
    return;
  }
  e.preventDefault();
  helpOpen.value = !helpOpen.value;
});

const store = useProgressStore();
// Completions, so "New best!" knows the previous best even on a direct visit.
await useAsyncData("completions", () => store.load());

// Completion dialog: this run's numbers, and whether they beat the old best.
const solvedOpen = ref(false);
const run = ref({ moves: 0, pushes: 0 });
const isNewBest = ref(false);
// The next level in play order, solved or not, for the solved dialog.
const levelIndex = computed(() =>
  (levels.value ?? []).findIndex((l) => l.id === levelId),
);
const nextLevel = computed(() => levels.value?.[levelIndex.value + 1]);

// Each collection unlocks in its own order; the server enforces the same rule.
const states = computed(() =>
  levelStates(levels.value ?? [], (id) => id in store.best),
);
// Not before this browser's progress is read: a level solved here while the
// server was out of reach would flash "locked" first.
const isLocked = computed(
  () => store.localReady && states.value.get(levelId) === "locked",
);
const nextLocked = computed(
  () => !!nextLevel.value && states.value.get(nextLevel.value.id) === "locked",
);
/** The level to solve to unlock this one: the current one in its collection. */
const currentLevel = computed(() => {
  const collection = levels.value?.[levelIndex.value]?.collection;
  return levels.value?.find(
    (l) => l.collection === collection && states.value.get(l.id) === "current",
  );
});

/** The saved best, once the level is solved. */
const best = computed(() => store.best[levelId]);

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

// The board bursts into sparks on a solve; the dialog opens once they've
// mostly faded. Same length as CELEBRATION_MS in packages/game, which isn't
// imported here because that would pull PixiJS into the server bundle.
const CELEBRATION_MS = 900;
const reducedMotion = usePreferredReducedMotion();
let dialogTimer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(dialogTimer));

// Screen readers hear pushes, undos, restarts and solves through a polite
// live region; plain walking stays quiet, so it doesn't drown them out.
const announcement = ref("");
let started = false;
function announce(prev: GameProgress, next: GameProgress) {
  const counts = `${count(next.moves, "move", "moves")}, ${count(next.pushes, "push", "pushes")}`;
  const goals = `${next.boxesOnGoals} of ${count(next.boxes, "box", "boxes")} on goals`;
  // The status line in the bottom bar is hidden from screen readers, so every
  // announcement that leaves a box stuck says so. A warning only; the move
  // stands until undone.
  const fix = next.undosLeft > 0 ? "undo with Z" : "restart with R";
  const stuck =
    next.deadBoxes === 0
      ? ""
      : next.deadBoxes === 1
        ? ` A box can't reach a goal from where it is; ${fix}.`
        : ` ${next.deadBoxes} boxes can't reach a goal from where they are; ${fix}.`;
  let text = "";
  if (!started) {
    started = true;
    if (next.moves > 0) text = `Resumed at ${counts}. ${goals}.${stuck}`;
  } else if (next.solved && !prev.solved) {
    text = `Solved in ${counts}.`;
  } else if (next.moves === 0 && prev.moves > 0) {
    text = `Back at the start. ${goals}.`;
  } else if (next.moves < prev.moves) {
    text = `Undone, ${count(next.undosLeft, "undo", "undos")} left. ${counts}. ${goals}.${stuck}`;
  } else if (next.pushes > prev.pushes) {
    text = `Pushed. ${goals}.${stuck}`;
  }
  if (!text) return;
  // Cleared first, so the same words twice in a row are read again.
  announcement.value = "";
  nextTick(() => {
    announcement.value = text;
  });
}

// Sounds follow the same changes; muted until the player turns them on in
// Settings.
const sound = useSound();
function playSound(prev: GameProgress, next: GameProgress) {
  // Loading the level, or a resumed run, makes no sound.
  if (!started) return;
  if (next.solved && !prev.solved) sound.play("solve");
  else if (next.moves === 0 && prev.moves > 0) sound.play("undo");
  else if (next.moves < prev.moves) sound.play("undo");
  else if (next.moves === prev.moves) return;
  else if (next.deadBoxes > prev.deadBoxes) sound.play("stuck");
  else if (next.boxesOnGoals > prev.boxesOnGoals) sound.play("goal");
  else if (next.pushes > prev.pushes) sound.play("push");
  else sound.play("step");
}

function onChange(next: GameProgress) {
  playSound(progress.value, next);
  announce(progress.value, next);
  progress.value = next;
  saveRun(next);
  if (!next.solved) {
    // An undo or restart during the burst cancels the dialog.
    clearTimeout(dialogTimer);
  }
}

/**
 * Where this level's best stands with the server: saved (verified), being
 * saved, kept on this device until the server can be reached, or refused.
 */
const saveState = computed(() => {
  if (store.rejected.includes(levelId)) return "rejected";
  if (!store.isUnsynced(levelId)) return "saved";
  return store.syncing ? "saving" : "local";
});

// A solve counts here at once, so the next level unlocks even when the server
// can't be reached; the server then replays the solution and keeps it if it
// really solves the level.
function onSolved({ log, moves, pushes }: GameProgress) {
  run.value = { moves, pushes };
  isNewBest.value = isBetter({ moves, pushes }, store.best[levelId]);
  clearTimeout(dialogTimer);
  dialogTimer = setTimeout(
    () => {
      solvedOpen.value = true;
    },
    reducedMotion.value === "reduce" ? 0 : CELEBRATION_MS,
  );
  store.recordSolve(levelId, {
    log,
    moves,
    pushes,
    solvedAt: new Date().toISOString(),
  });
  store.sync();
}

function replay() {
  solvedOpen.value = false;
  game.value?.restart();
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!--
      The level, with every way to leave it: back to Levels, its name (which
      opens the level picker), and Settings. The same on every screen.
    -->
    <header class="border-b">
      <div
        class="mx-auto grid h-14 w-full max-w-5xl grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-4"
      >
        <Button
          variant="ghost"
          size="sm"
          as-child
          class="justify-self-start max-sm:w-control-compact max-sm:px-0"
        >
          <NuxtLink to="/levels" aria-label="All levels" title="All levels">
            <ArrowLeftIcon data-icon="inline-start" />
            <span class="max-sm:sr-only">Levels</span>
          </NuxtLink>
        </Button>
        <!-- The level's name opens the level picker. -->
        <Button
          variant="ghost"
          class="h-auto min-w-0 flex-col gap-0 px-3 py-1"
          aria-haspopup="dialog"
          :aria-label="`${level.title}: choose a level`"
          title="Choose a level"
          @click="switcherOpen = true"
        >
          <span class="flex max-w-full items-center gap-1">
            <span class="truncate text-sm font-semibold">{{ level.title }}</span>
            <ChevronDownIcon class="size-4 shrink-0" />
          </span>
          <span
            v-if="collection"
            class="max-w-full truncate text-xs font-normal text-muted-foreground"
          >
            {{ collection.title }} · {{ level.number }} of
            {{ collectionSize }}
          </span>
        </Button>
        <div class="justify-self-end">
          <PlaySettingsMenu @help="helpOpen = true" />
        </div>
      </div>
    </header>

    <div
      class="relative min-h-0 flex-1 bg-muted bg-tile-grid [--tile-grid-size:24px]"
    >
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
            :log="savedRun"
            :label="`${level.title}, a Sokoban board. Arrow keys or WASD to move, Z to undo, Y to redo, R to restart, plus and minus to zoom; question mark for all controls.`"
            class="size-full touch-none select-none"
            @change="onChange"
            @solved="onSolved"
            @camera="camera = $event"
          />
        </div>
        <BoardMapControls
          :camera="camera"
          class="absolute right-3 bottom-3"
          @zoom-in="game?.zoomIn()"
          @zoom-out="game?.zoomOut()"
          @fit="game?.fit()"
          @recenter="game?.recenter()"
        />
        <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      </template>
    </div>

    <!-- The run and the game's buttons, within thumb reach. Nothing on a locked
         level, which has its own way out. -->
    <footer
      v-if="!isLocked"
      class="border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-2">
        <!--
          One line of status: how to start, a stuck box, or the counts. The
          live region says the same, so this one stays silent.
        -->
        <div
          aria-hidden="true"
          class="flex min-h-6 items-center justify-between gap-3 text-sm text-muted-foreground"
        >
          <template v-if="!progress.solved && progress.moves === 0">
            <span class="truncate sm:hidden">Drag to move · pinch to zoom</span>
            <span class="hidden truncate sm:inline">
              Arrows or WASD to move · ? for all controls
            </span>
          </template>
          <span
            v-else-if="!progress.solved && progress.deadBoxes > 0"
            class="truncate text-foreground"
          >
            A crossed box can't reach a goal ·
            <template v-if="progress.undosLeft > 0">
              <span class="sm:hidden">Undo</span>
              <span class="hidden sm:inline">Z to undo</span>
            </template>
            <template v-else>
              <span class="sm:hidden">Restart</span>
              <span class="hidden sm:inline">R to restart</span>
            </template>
          </span>
          <span v-else class="truncate font-mono">
            {{ count(progress.moves, "move", "moves") }} ·
            {{ count(progress.pushes, "push", "pushes") }}
          </span>
          <span v-if="best" class="shrink-0 font-mono">
            Best {{ best.moves }}
          </span>
        </div>

        <!-- Labelled at every width; the keys are in the tooltips. -->
        <div class="grid grid-cols-3 gap-2 sm:flex">
          <Button
            variant="outline"
            size="sm"
            :title="`Undo (Z), ${count(progress.undosLeft, 'undo', 'undos')} left this attempt`"
            :aria-label="`Undo, ${progress.undosLeft} left`"
            aria-keyshortcuts="Z U"
            :disabled="progress.moves === 0 || progress.undosLeft === 0"
            @click="game?.undo()"
          >
            <Undo2Icon data-icon="inline-start" />
            Undo
            <span class="font-mono text-muted-foreground">
              {{ progress.undosLeft }}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Redo (Y)"
            aria-keyshortcuts="Y"
            :disabled="!progress.canRedo"
            @click="game?.redo()"
          >
            <Redo2Icon data-icon="inline-start" />
            Redo
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Restart (R), with all undos back"
            aria-keyshortcuts="R"
            :disabled="progress.moves === 0 && progress.undosLeft === UNDO_BUDGET"
            @click="game?.restart()"
          >
            <RotateCcwIcon data-icon="inline-start" />
            Restart
          </Button>
        </div>
      </div>
    </footer>

    <PlayControlsHelp v-model:open="helpOpen" />
    <LevelSwitcher
      v-model:open="switcherOpen"
      :levels="levels ?? []"
      :collections="collections ?? []"
      :current="level"
      :states="states"
      :best="store.best"
    />

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
              <template v-if="best">
                <CardTitle class="font-mono text-title">
                  {{ count(best.moves, "move", "moves") }}
                </CardTitle>
                <p class="font-mono text-sm text-muted-foreground">
                  {{ count(best.pushes, "push", "pushes") }}
                </p>
              </template>
              <p
                v-if="saveState === 'rejected'"
                class="text-sm text-destructive"
              >
                The server couldn't verify this run
              </p>
              <p
                v-else-if="saveState === 'saving'"
                class="text-sm text-muted-foreground"
              >
                Saving…
              </p>
              <p
                v-else-if="saveState === 'local'"
                class="text-sm text-muted-foreground"
              >
                Saved on this device; it'll sync when the server is back
              </p>
            </CardHeader>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="replay">
            <RotateCcwIcon data-icon="inline-start" />
            Replay
          </Button>
          <!--
            Solving unlocks the next level at once, saved or not; it stays
            locked only if the server refused this run.
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
          <!-- The last level. -->
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
