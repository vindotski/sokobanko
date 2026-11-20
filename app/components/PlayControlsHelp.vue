<script setup lang="ts">
import { UNDO_BUDGET } from "@sokobanko/core";
import { useMediaQuery } from "@vueuse/core";

// Every way to play, on a touch screen and with a keyboard and mouse.
const open = defineModel<boolean>("open", { required: true });

// From the bottom on phones, within thumb reach; from the side elsewhere.
const wide = useMediaQuery("(min-width: 640px)");
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent :side="wide ? 'right' : 'bottom'" class="overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Controls</SheetTitle>
        <SheetDescription>
          Push every box onto a goal. You can't pull, so plan ahead; a crossed
          box can't reach a goal any more. Each attempt has {{ UNDO_BUDGET }}
          undos; Restart gives them all back.
        </SheetDescription>
      </SheetHeader>
      <div class="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ControlsTable />
      </div>
    </SheetContent>
  </Sheet>
</template>
