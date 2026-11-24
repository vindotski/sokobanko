<script setup lang="ts">
import { parseLevel } from "@sokoban/core";
import { onKeyStroke } from "@vueuse/core";

/**
 * A level's card, over the map (pages/index.vue): a bottom sheet on phones,
 * a panel beside the map on large screens. Visited directly (from search or a
 * shared link) it's server-rendered with the map behind it.
 */
const route = useRoute();
const { data: levels } = await useFetch("/api/levels", { key: "levels" });
const { data: collections } = await useFetch("/api/collections", {
  key: "collections",
});
const level = computed(() =>
  levels.value?.find((l) => l.id === route.params.id),
);
if (!level.value) {
  throw createError({ statusCode: 404, statusMessage: "Level not found" });
}
const view = useProgressView();

const own = computed(() =>
  (levels.value ?? []).filter((l) => l.collection === level.value?.collection),
);
const index = computed(() =>
  own.value.findIndex((l) => l.id === level.value?.id),
);
const collection = computed(() =>
  collections.value?.find((c) => c.id === level.value?.collection),
);
const boxes = computed(() =>
  level.value ? parseLevel(level.value).boxes.reduce((n, b) => n + b, 0) : 0,
);
const state = computed(() =>
  view.value.source !== "none" && level.value
    ? view.value.states[level.value.id]
    : undefined,
);
/** The level up next in this collection, which unlocks this one. */
const unlocker = computed(() =>
  own.value.find((l) => view.value.states[l.id] === "current"),
);

usePageSeo({
  title: () => `${level.value?.title} · Level ${level.value?.number} · Sokoban`,
  description: () =>
    `Level ${level.value?.number} of ${collection.value?.title ?? "Sokoban"}: push ${boxes.value} ${boxes.value === 1 ? "box" : "boxes"} onto ${boxes.value === 1 ? "its goal" : "their goals"}. Free to play in your browser, no sign-up.`,
  path: () => `/levels/${level.value?.id}`,
});

// A sheet on phones: Escape closes it, and focus moves to its title.
onKeyStroke("Escape", () => navigateTo("/"));
onMounted(() => {
  document.getElementById("level-title")?.focus({ preventScroll: true });
});
</script>

<template>
  <div
    v-if="level"
    class="fixed inset-0 z-50 flex flex-col justify-end lg:sticky lg:top-6 lg:inset-auto lg:z-auto lg:block"
  >
    <!-- Behind the sheet on phones: a tap closes it. -->
    <NuxtLink
      to="/"
      class="absolute inset-0 bg-black/50 lg:hidden"
      aria-hidden="true"
      tabindex="-1"
    />
    <div
      class="relative max-h-[85dvh] overflow-y-auto border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:max-h-none lg:border"
    >
      <LevelDetail
        :level="level"
        :collection-title="collection?.title"
        :collection-size="own.length"
        :boxes="boxes"
        :state="state"
        :best="view.best[level.id]"
        :unsynced="view.unsynced.includes(level.id)"
        :unlocker="unlocker"
        :previous="own[index - 1]"
        :next="own[index + 1]"
      />
    </div>
  </div>
</template>
