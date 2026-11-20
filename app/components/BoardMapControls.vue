<script setup lang="ts">
import {
  LocateFixedIcon,
  Maximize2Icon,
  MinusIcon,
  PlusIcon,
} from "@lucide/vue";
import type { CameraState } from "@sokobanko/game";

// Map-style camera buttons over the board's corner, like a map app's.
defineProps<{ camera: CameraState }>();
const emit = defineEmits<{
  zoomIn: [];
  zoomOut: [];
  fit: [];
  recenter: [];
}>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Zoom in"
      title="Zoom in (+)"
      aria-keyshortcuts="+"
      :disabled="!camera.canZoomIn"
      @click="emit('zoomIn')"
    >
      <PlusIcon />
    </Button>
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Zoom out"
      title="Zoom out (−)"
      aria-keyshortcuts="-"
      :disabled="!camera.canZoomOut"
      @click="emit('zoomOut')"
    >
      <MinusIcon />
    </Button>
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Show whole level"
      title="Show whole level (hold Space to peek)"
      :disabled="camera.fitted"
      @click="emit('fit')"
    >
      <Maximize2Icon />
    </Button>
    <!-- Only once the camera has been panned or zoomed away from the player. -->
    <Button
      v-if="!camera.following"
      variant="outline"
      size="icon-sm"
      aria-label="Back to player"
      title="Back to player (or just move)"
      @click="emit('recenter')"
    >
      <LocateFixedIcon />
    </Button>
  </div>
</template>
