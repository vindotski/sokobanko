<script setup lang="ts">
// /play without an id: jump to the first level in play order that the user
// hasn't solved yet, or to the level list once everything is solved.
const { data: levels } = await useLevels();
const solved = await useProgressStore().load();
const next = (levels.value ?? []).find((level) => !(level.id in solved));

await navigateTo(next ? `/play/${next.id}` : "/levels", { replace: true });
</script>

<template>
  <div />
</template>
