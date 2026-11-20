<script setup lang="ts">
import {
  KeyboardIcon,
  ListIcon,
  MapIcon,
  PlayIcon,
  RotateCcwIcon,
} from "@lucide/vue";
import { useMediaQuery } from "@vueuse/core";

/**
 * The game's pause menu: back to playing, restart, another level, the theme
 * and sound, the controls, or back to the map. From the bottom on phones,
 * from the side elsewhere.
 */
defineProps<{ levelId: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ restart: []; levels: []; help: [] }>();
const wide = useMediaQuery("(min-width: 768px)");

function then(event: "restart" | "levels" | "help") {
  open.value = false;
  if (event === "restart") emit("restart");
  else if (event === "levels") emit("levels");
  else emit("help");
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :side="wide ? 'right' : 'bottom'"
      class="gap-0 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
    >
      <SheetHeader class="border-b">
        <SheetTitle>Paused</SheetTitle>
        <SheetDescription class="sr-only">
          Resume, restart, change level or settings.
        </SheetDescription>
      </SheetHeader>
      <div class="flex flex-col gap-6 p-4">
        <div class="flex flex-col gap-2">
          <Button size="lg" @click="open = false">
            <PlayIcon data-icon="inline-start" />
            Resume
          </Button>
          <Button variant="outline" @click="then('restart')">
            <RotateCcwIcon data-icon="inline-start" />
            Restart
          </Button>
          <Button variant="outline" @click="then('levels')">
            <ListIcon data-icon="inline-start" />
            Levels
          </Button>
          <Button variant="outline" @click="then('help')">
            <KeyboardIcon data-icon="inline-start" />
            Controls
            <kbd class="ml-auto font-mono text-label text-muted-foreground max-sm:hidden">?</kbd>
          </Button>
        </div>
        <SettingsControls />
        <Button variant="ghost" as-child>
          <NuxtLink :to="`/levels/${levelId}`">
            <MapIcon data-icon="inline-start" />
            Quit to map
          </NuxtLink>
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
