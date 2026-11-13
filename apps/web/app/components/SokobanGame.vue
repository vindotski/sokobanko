<script setup lang="ts">
import type { LevelJson } from "@sokoban/core";
import type {
  Game,
  GamePadding,
  GameProgress,
  OverviewState,
} from "@sokoban/game";

const props = defineProps<{
  level: LevelJson;
  /** Space to keep free around the board, e.g. for overlays. */
  padding?: GamePadding;
  /** Moves to start from, as LURD, e.g. a half-played run. */
  solution?: string;
  /** What screen readers call the board, with its controls. */
  label?: string;
}>();
const emit = defineEmits<{
  change: [progress: GameProgress];
  solved: [progress: GameProgress];
  overview: [state: OverviewState];
}>();

const container = useTemplateRef("container");
let game: Game | undefined;
let unmounted = false;

onMounted(async () => {
  // PixiJS needs the DOM, so load it only on the client.
  const { createGame } = await import("@sokoban/game");
  const el = container.value;
  if (!el || unmounted) return;

  const initialLevel = props.level;
  const created = await createGame(el, initialLevel, {
    ...(props.padding && { padding: props.padding }),
    palette: readBoardPalette(),
    ...(props.solution && { initialSolution: props.solution }),
    onChange: (progress) => emit("change", progress),
    onSolved: (progress) => emit("solved", progress),
    onOverviewChange: (state) => emit("overview", state),
  });
  if (unmounted) {
    created.destroy();
    return;
  }
  game = created;
  if (props.level !== initialLevel) game.setLevel(props.level);
});

watch(
  () => props.level,
  (level) => game?.setLevel(level),
);

// Redraw when the theme changes. flush "post" runs after the DOM update, so
// <html> already has the new theme class when the colors are read.
const colorMode = useColorMode();
watch(
  () => colorMode.value,
  () => game?.setPalette(readBoardPalette()),
  { flush: "post" },
);

defineExpose({
  undo: () => game?.undo(),
  redo: () => game?.redo(),
  restart: () => game?.restart(),
  setOverview: (on: boolean) => game?.setOverview(on),
});

onBeforeUnmount(() => {
  unmounted = true;
  game?.destroy();
  game = undefined;
});
</script>

<template>
  <!--
    An application, so screen readers pass the arrow keys through to the
    game once the board has focus; the keys work anywhere on the page.
  -->
  <div
    ref="container"
    role="application"
    tabindex="0"
    :aria-label="label"
    class="relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&>canvas]:absolute [&>canvas]:inset-0"
  />
</template>
