<script setup lang="ts">
/**
 * Copies the browser's progress (useProgress, TanStack DB) into
 * useProgressView for the server-rendered pages. Mounted lazily by the app
 * layout, so the collections load after the page has rendered.
 */
const progress = useProgress();
const view = useProgressView();

watchEffect(() => {
  view.value = {
    ready: progress.isReady.value,
    states: Object.fromEntries(progress.states.value),
    best: progress.best.value,
    unsynced: progress.levels.value
      .filter((level) => progress.isUnsynced(level.id))
      .map((level) => level.id),
  };
});
</script>

<template>
  <span hidden />
</template>
