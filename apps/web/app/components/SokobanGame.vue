<script setup lang="ts">
import type { LevelJson } from "@sokobanko/core";
import type { Game, GameProgress } from "@sokobanko/game";

const props = defineProps<{ level: LevelJson }>();
const emit = defineEmits<{
  change: [progress: GameProgress];
  solved: [progress: GameProgress];
}>();

const container = useTemplateRef("container");
let game: Game | undefined;
let unmounted = false;

onMounted(async () => {
  // PixiJS needs the DOM, so load it only on the client.
  const { createGame } = await import("@sokobanko/game");
  const el = container.value;
  if (!el || unmounted) return;

  const initialLevel = props.level;
  const created = await createGame(el, initialLevel, {
    onChange: (progress) => emit("change", progress),
    onSolved: (progress) => emit("solved", progress),
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

defineExpose({
  undo: () => game?.undo(),
  restart: () => game?.restart(),
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
