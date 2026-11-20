<script setup lang="ts">
import { ArrowLeftIcon, ChevronDownIcon, PauseIcon } from "@lucide/vue";
import { isBetter, UNDO_BUDGET } from "@sokobanko/core";
import type { CameraState, GameProgress } from "@sokobanko/game";
import {
  onKeyStroke,
  useOnline,
  usePreferredReducedMotion,
} from "@vueuse/core";
import { localData } from "~/collections";

definePageMeta({ layout: "game" });

const route = useRoute();
// Levels and progress from the browser's collections (useProgress). Waiting
// for the server's bests too (or for it to fail, offline) means a level
// solved before doesn't flash "locked".
const local = localData();
await Promise.all([
  local.levels.preload(),
  local.levelCollections.preload(),
  local.verified.preload().catch(() => {}),
]);
const {
  levels,
  collections,
  best: bests,
  states,
  isUnsynced,
  rejected,
  recordSolve,
} = useProgress();
const level = levels.value.find((l) => l.id === route.params.id);
if (!level) {
  throw createError({ statusCode: 404, statusMessage: "Level not found" });
}
const levelId = level.id;
// Personal and interactive, so search engines skip it (routeRules sends the
// same as a header); the level's card is the page to index.
useSeoMeta({ title: `${level.title} · Sokobanko`, robots: "noindex" });
// The collection and its author, under the title.
const collection = computed(() =>
  collections.value.find((c) => c.id === level.collection),
);
/** How many levels the collection has, for "8 of 155". */
const collectionSize = computed(
  () => levels.value.filter((l) => l.collection === level.collection).length,
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

// The controls help: from the pause menu, or the ? key anywhere but a text
// field or another dialog.
const helpOpen = ref(false);
// The pause menu: resume, restart, levels, settings, controls, the map.
const pauseOpen = ref(false);
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

// Completion dialog: this run's numbers, and whether they beat the old best.
const solvedOpen = ref(false);
const run = ref({ moves: 0, pushes: 0 });
const isNewBest = ref(false);
// The next level in play order, solved or not, for the solved dialog.
const levelIndex = computed(() =>
  levels.value.findIndex((l) => l.id === levelId),
);
const nextLevel = computed(() => levels.value[levelIndex.value + 1]);

// Each collection unlocks in its own order; the server enforces the same rule.
// A locked level has nothing to play: its card says what unlocks it.
const isLocked = computed(() => states.value.get(levelId) === "locked");
if (isLocked.value) await navigateTo(`/levels/${levelId}`, { replace: true });
const nextLocked = computed(
  () => !!nextLevel.value && states.value.get(nextLevel.value.id) === "locked",
);
/**
 * One line under the HUD: how to start, a stuck box and what to do about it,
 * or nothing. The live region tells screen readers the same.
 */
const coarse = import.meta.client && matchMedia("(pointer: coarse)").matches;
const status = computed(() => {
  const p = progress.value;
  if (p.solved) return "";
  if (p.moves === 0) {
    return coarse
      ? "Drag to move · pinch to zoom"
      : "Arrows or WASD to move · ? for all controls";
  }
  if (p.deadBoxes > 0) {
    const fix =
      p.undosLeft > 0
        ? coarse
          ? "Undo"
          : "Z to undo"
        : coarse
          ? "Restart"
          : "R to restart";
    return `A crossed box can't reach a goal · ${fix}`;
  }
  return "";
});

/** The saved best, once the level is solved. */
const best = computed(() => bests.value[levelId]);

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
const online = useOnline();
const saveState = computed(() => {
  if (rejected.value.has(levelId)) return "rejected";
  if (!isUnsynced(levelId)) return "saved";
  return online.value ? "saving" : "local";
});

// A solve counts here at once, so the next level unlocks even when the server
// can't be reached: it goes into the upload outbox (collections/index.ts), and
// the server replays the log and keeps it if it really solves the level.
function onSolved({ log, moves, pushes }: GameProgress) {
  run.value = { moves, pushes };
  isNewBest.value = isBetter({ moves, pushes }, bests.value[levelId]);
  clearTimeout(dialogTimer);
  dialogTimer = setTimeout(
    () => {
      solvedOpen.value = true;
    },
    reducedMotion.value === "reduce" ? 0 : CELEBRATION_MS,
  );
  recordSolve(levelId, {
    log,
    moves,
    pushes,
    solvedAt: new Date().toISOString(),
  });
}

function replay() {
  solvedOpen.value = false;
  game.value?.restart();
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!--
      Every way out of the level: back to its card on the map, its name (which
      opens the level picker), and Pause. The same on every screen.
    -->
    <header class="border-b pt-[env(safe-area-inset-top)]">
      <div
        class="mx-auto grid h-14 w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-2 sm:px-4"
      >
        <Button
          variant="ghost"
          as-child
          class="justify-self-start max-sm:w-control max-sm:px-0"
        >
          <NuxtLink :to="`/levels/${levelId}`" aria-label="Map" title="Map">
            <ArrowLeftIcon data-icon="inline-start" />
            <span class="max-sm:sr-only">Map</span>
          </NuxtLink>
        </Button>
        <!-- The level's name opens the level picker. -->
        <Button
          variant="ghost"
          class="h-auto min-h-control min-w-0 flex-col gap-0 px-3 py-1"
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
        <Button
          variant="ghost"
          class="justify-self-end max-sm:w-control max-sm:px-0"
          aria-haspopup="dialog"
          aria-label="Pause"
          title="Pause"
          @click="pauseOpen = true"
        >
          <PauseIcon data-icon="inline-start" />
          <span class="max-sm:sr-only">Pause</span>
        </Button>
      </div>
    </header>

    <!-- The run at a glance; in the side panel on large screens. -->
    <GameHud :progress="progress" :best="best" class="border-b lg:hidden" />

    <div class="flex min-h-0 flex-1">
      <div
        class="relative min-h-0 flex-1 bg-muted bg-tile-grid [--tile-grid-size:24px]"
      >
        <template v-if="!isLocked">
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

      <!-- Large screens: the HUD and the controls beside the board. -->
      <aside
        class="hidden w-80 shrink-0 flex-col gap-6 border-l bg-background p-4 lg:flex"
        aria-label="Run"
      >
        <GameHud :progress="progress" :best="best" layout="column" />
        <p aria-hidden="true" class="min-h-12 text-small text-muted-foreground">
          {{ status }}
        </p>
        <div class="flex flex-col gap-2">
          <GameButtons
            :progress="progress"
            @undo="game?.undo()"
            @redo="game?.redo()"
            @restart="game?.restart()"
          />
        </div>
      </aside>
    </div>

    <!-- Phones and tablets: the status, then the controls in thumb reach. -->
    <footer
      class="border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div class="mx-auto flex w-full max-w-xl flex-col gap-2 px-4 py-2">
        <p
          aria-hidden="true"
          class="min-h-6 truncate text-small text-muted-foreground"
        >
          {{ status }}
        </p>
        <div class="grid grid-cols-3 gap-2">
          <GameButtons
            :progress="progress"
            @undo="game?.undo()"
            @redo="game?.redo()"
            @restart="game?.restart()"
          />
        </div>
      </div>
    </footer>

    <PauseSheet
      v-model:open="pauseOpen"
      :level-id="levelId"
      @restart="game?.restart()"
      @levels="switcherOpen = true"
      @help="helpOpen = true"
    />
    <PlayControlsHelp v-model:open="helpOpen" />
    <LevelSwitcher
      v-model:open="switcherOpen"
      :levels="levels"
      :collections="collections"
      :current="level"
      :states="states"
      :best="bests"
    />
    <LevelComplete
      v-model:open="solvedOpen"
      :title="level.title"
      :level-id="levelId"
      :run="run"
      :best="best"
      :is-new-best="isNewBest"
      :save-state="saveState"
      :next="nextLevel"
      :next-locked="nextLocked"
      @replay="replay"
    />
  </div>
</template>
