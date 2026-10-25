<script setup lang="ts">
const counter = useCounterStore();
</script>

<template>
  <main class="flex min-h-svh flex-col items-center justify-center gap-4">
    <h1 class="text-3xl font-bold">Sokobanko</h1>
    <Button @click="counter.increment()">Count: {{ counter.count }}</Button>
  </main>
</template>
