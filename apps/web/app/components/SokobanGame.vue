<script setup lang="ts">
import type { LevelJson } from "@sokobanko/core";
import type {
  Game,
  GamePadding,
  GamePalette,
  GameProgress,
  OverviewState,
} from "@sokobanko/game";

const props = defineProps<{
  level: LevelJson;
  /** Space to keep free around the board, e.g. for overlays. */
  padding?: GamePadding;
}>();
const emit = defineEmits<{
  change: [progress: GameProgress];
  solved: [progress: GameProgress];
  overview: [state: OverviewState];
}>();

const container = useTemplateRef("container");
let game: Game | undefined;
let unmounted = false;

// The canvas can't use CSS, so read the theme's --board-* colors from it.
const PALETTE_VARS: Record<keyof GamePalette, string> = {
  wall: "--board-wall",
  floor: "--board-floor",
  goal: "--board-goal",
  box: "--board-box",
  boxOnGoal: "--board-box-on-goal",
  player: "--board-player",
};

function readPalette(): Partial<GamePalette> {
  const style = getComputedStyle(document.documentElement);
  const palette: Partial<GamePalette> = {};
  for (const [key, name] of Object.entries(PALETTE_VARS)) {
    const value = style.getPropertyValue(name).trim();
    if (value) palette[key as keyof GamePalette] = value;
  }
  return palette;
}

onMounted(async () => {
  // PixiJS needs the DOM, so load it only on the client.
  const { createGame } = await import("@sokobanko/game");
  const el = container.value;
  if (!el || unmounted) return;

  const initialLevel = props.level;
  const created = await createGame(el, initialLevel, {
    ...(props.padding && { padding: props.padding }),
    palette: readPalette(),
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
  () => game?.setPalette(readPalette()),
  { flush: "post" },
);

defineExpose({
  undo: () => game?.undo(),
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
  <div
    ref="container"
    class="relative overflow-hidden [&>canvas]:absolute [&>canvas]:inset-0"
  />
</template>
