<script setup lang="ts">
import { UNDO_BUDGET } from "@sokoban/core";

// Every way to play, on a touch screen and with a keyboard and mouse: in the
// game's help sheet and on the Help page.
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
  { action: "These controls", touch: "Pause, then Controls", keys: "?" },
];
</script>

<template>
  <!-- Wrapping cells, so it fits a narrow sheet instead of scrolling sideways. -->
  <Table class="[&_td]:whitespace-normal [&_th]:whitespace-normal">
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
        <TableCell>{{ row.touch }}</TableCell>
        <TableCell class="hidden sm:table-cell">{{ row.keys }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
