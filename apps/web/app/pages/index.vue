<script setup lang="ts">
import type { LevelJson } from "@sokobanko/core";

const counter = useCounterStore();

const level: LevelJson = {
  id: "world1-001",
  title: "Hello World!",
  map: ["##########", "####....##", "#  $$$$###", "#  @   ###", "##########"],
};
</script>

<template>
  <main class="flex min-h-svh flex-col items-center justify-center gap-4">
    <h1 class="text-3xl font-bold">Sokobanko</h1>
    <SokobanGame :level="level" class="h-96 w-full max-w-2xl" />
    <Button @click="counter.increment()">Count: {{ counter.count }}</Button>
  </main>
</template>
