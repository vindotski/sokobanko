<script setup lang="ts">
/**
 * Today's daily puzzle, at a link that stays the same: it sends the player
 * to the day's level, played in daily mode (pages/play/[id].vue).
 */
const { data: daily } = await useFetch("/api/daily", { key: "daily-link" });
if (!daily.value) {
  throw createError({ statusCode: 404, statusMessage: "No daily puzzle" });
}
await navigateTo(`/play/${daily.value.level.id}?daily`, { replace: true });
</script>

<template>
  <div />
</template>
