<script setup lang="ts">
/**
 * Copies the browser's progress (useProgress, TanStack DB) into
 * useProgressView for the server-rendered pages, once it's read, and keeps
 * the map hint cookie (utils/mapHint.ts) up to date for the next visit: only
 * once a level is solved, so a visit alone sets no cookie.
 * Mounted lazily by the app layout, so the collections load after the page
 * has rendered; until then the pages keep what the server drew.
 */
const progress = useProgress();
const view = useProgressView();
const hint = useMapCookie(MAP_HINT_COOKIE);

watchEffect(() => {
  if (!progress.isReady.value) return;
  view.value = {
    source: "live",
    states: Object.fromEntries(progress.states.value),
    best: progress.best.value,
    unsynced: progress.levels.value
      .filter((level) => progress.isUnsynced(level.id))
      .map((level) => level.id),
  };
  const solvedAny = [...progress.states.value.values()].includes("solved");
  const next = solvedAny
    ? serializeHint(
        hintFromStates(progress.levels.value, progress.states.value),
      )
    : null;
  if (hint.value !== next) hint.value = next;
});
</script>

<template>
  <span hidden />
</template>
