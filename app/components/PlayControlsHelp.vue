<script setup lang="ts">
import { UNDO_BUDGET } from "@sokobanko/core";
import { useMediaQuery } from "@vueuse/core";

// Every way to play, on a touch screen and with a keyboard and mouse.
const open = defineModel<boolean>("open", { required: true });

// From the bottom on phones, within thumb reach; from the side elsewhere.
const wide = useMediaQuery("(min-width: 640px)");

const controls = [
  { action: "Move", touch: "Drag on the board", keys: "Arrows or WASD" },
  {
    action: `Undo (${UNDO_BUDGET} per attempt)`,
    touch: "Undo button",
    keys: "Z or U",
  },
  { action: "Redo", touch: "Redo button", keys: "Y" },
  { action: "Restart", touch: "Restart button", keys: "R" },
  {
    action: "Zoom",
    touch: "Pinch, or + and −",
    keys: "+ and −, or Ctrl/⌘ and scroll",
  },
  { action: "Look around", touch: "Drag with two fingers", keys: "Scroll" },
  {
    action: "See the whole level",
    touch: "Whole-level button",
    keys: "Hold Space",
  },
  {
    action: "Back to the player",
    touch: "Move, or the locate button",
    keys: "Move",
  },
  {
    action: "Another level",
    touch: "Tap the level's name",
    keys: "Click the level's name",
  },
  { action: "These controls", touch: "Settings, then Controls", keys: "?" },
];
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
      <Table class="mx-4 w-auto">
        <TableHeader>
          <TableRow>
            <TableHead>To</TableHead>
            <TableHead>Touch</TableHead>
            <!-- Phones have no keyboard; the column would only crowd them. -->
            <TableHead class="hidden sm:table-cell">Keyboard and mouse</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in controls" :key="row.action">
            <TableCell class="font-medium">{{ row.action }}</TableCell>
            <TableCell class="whitespace-normal">{{ row.touch }}</TableCell>
            <TableCell class="hidden whitespace-normal sm:table-cell">
              {{ row.keys }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </SheetContent>
  </Sheet>
</template>
