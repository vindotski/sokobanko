<script setup lang="ts">
import { Redo2Icon, RotateCcwIcon, Undo2Icon } from "@lucide/vue";
import { UNDO_BUDGET } from "@sokobanko/core";
import type { GameProgress } from "@sokobanko/game";

/** Undo, redo and restart: 44px, labelled, with the keys in their tooltips. */
defineProps<{ progress: GameProgress }>();
const emit = defineEmits<{ undo: []; redo: []; restart: [] }>();
</script>

<template>
  <Button
    variant="outline"
    :title="`Undo (Z), ${progress.undosLeft} left this attempt`"
    :aria-label="`Undo, ${progress.undosLeft} left`"
    aria-keyshortcuts="Z U"
    :disabled="progress.moves === 0 || progress.undosLeft === 0"
    @click="emit('undo')"
  >
    <Undo2Icon data-icon="inline-start" />
    Undo
    <span class="font-mono text-muted-foreground">{{ progress.undosLeft }}</span>
  </Button>
  <Button
    variant="outline"
    title="Redo (Y)"
    aria-keyshortcuts="Y"
    :disabled="!progress.canRedo"
    @click="emit('redo')"
  >
    <Redo2Icon data-icon="inline-start" />
    Redo
  </Button>
  <Button
    variant="outline"
    title="Restart (R), with all undos back"
    aria-keyshortcuts="R"
    :disabled="progress.moves === 0 && progress.undosLeft === UNDO_BUDGET"
    @click="emit('restart')"
  >
    <RotateCcwIcon data-icon="inline-start" />
    Restart
  </Button>
</template>
