<script setup lang="ts">
/**
 * Play: the map. Server-rendered, so search engines get every level as a
 * link and the intro. A returning player's map is drawn from the map hint
 * cookie (seedProgressView), already scrolled to the level up next, so
 * nothing moves when the browser's own progress arrives. A level's card opens
 * over the map (pages/index/levels/[id].vue): a sheet on phones, a panel
 * beside it on large screens.
 */
const { data: levels } = await useFetch("/api/levels", { key: "levels" });
const { data: collections } = await useFetch("/api/collections", {
  key: "collections",
});
seedProgressView(levels.value);
const view = useProgressView();
/** Whether the levels' states are known yet, from the hint or the browser. */
const known = computed(() => view.value.source !== "none");
const route = useRoute();
const cardOpen = computed(() => route.path.startsWith("/levels/"));

usePageSeo({
  title: "Sokoban · Free Sokoban puzzles in your browser",
  description:
    "The classic box-pushing puzzle: 159 levels, no sign-up, on your phone or computer. Push every box onto a goal, one move at a time.",
  path: "/",
});
useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: "Sokoban",
        url: useRuntimeConfig().public.siteUrl,
        description:
          "The classic box-pushing puzzle in the browser, with server-verified results and no sign-up.",
        genre: "Puzzle",
        gamePlatform: "Web browser",
        applicationCategory: "Game",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
        author: {
          "@type": "Person",
          name: "Ivan Vinski",
          url: "https://www.vin.ski",
        },
      }),
    },
  ],
});

const sections = computed(() =>
  (collections.value ?? []).map((collection) => {
    const own = (levels.value ?? []).filter(
      (l) => l.collection === collection.id,
    );
    return {
      collection,
      levels: own,
      solved: own.filter((l) => view.value.states[l.id] === "solved").length,
    };
  }),
);
const total = computed(() => levels.value?.length ?? 0);
const solved = computed(
  () => Object.values(view.value.states).filter((s) => s === "solved").length,
);
function withCollection(
  level: NonNullable<typeof levels.value>[number] | undefined,
) {
  if (!level) return undefined;
  const collectionTitle = collections.value?.find(
    (c) => c.id === level.collection,
  )?.title;
  return { ...level, collectionTitle };
}
const next = computed(() =>
  withCollection(
    (levels.value ?? []).find((l) => view.value.states[l.id] === "current"),
  ),
);
const first = computed(() => withCollection(levels.value?.[0]));
const levelIds = computed(() => (levels.value ?? []).map((l) => l.id));

// Bring the level up next into view, but not when a card was opened
// directly, which is what the visitor came for. Drawn from the hint, the page
// does it while it loads: the map stays hidden (main.css) until a script
// right after that level's collection has scrolled to it, so it never shows
// at the top and then jumps. The browser keeps the server's choice, so the
// script is hydrated, not added.
const placeOnLoad = useState(
  "map-place-on-load",
  () =>
    import.meta.server &&
    view.value.source === "hint" &&
    !!next.value &&
    !cardOpen.value,
);
if (import.meta.server && placeOnLoad.value) {
  useHead({ htmlAttrs: { "data-map-placing": "" } });
}
const placeScript =
  'document.querySelector("[data-current]")?.scrollIntoView({block:"center"});' +
  'document.documentElement.removeAttribute("data-map-placing")';
onMounted(() => {
  placeOnLoad.value = false;
});
// Otherwise once the progress is in: instant, and once the app is ready.
const pageReady = ref(false);
onNuxtReady(() => {
  pageReady.value = true;
});
let scrolled = placeOnLoad.value;
watch(
  () => known.value && pageReady.value,
  async (ready) => {
    if (!ready || scrolled || cardOpen.value) return;
    scrolled = true;
    await nextTick();
    document
      .querySelector("[data-current]")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  },
  { immediate: true },
);
</script>

<template>
  <PageHeader title="Sokoban" subtitle="Free Sokoban puzzles in your browser" />
  <!-- One column, or the map and a level's card side by side from lg. -->
  <div
    class="mx-auto grid w-full max-w-5xl flex-1 items-start gap-8 px-4 py-6"
    :class="{ 'lg:grid-cols-[minmax(0,1fr)_24rem]': cardOpen }"
  >
    <div class="flex min-w-0 flex-col gap-8">
      <ContinueCard
        :ready="known"
        :next="next"
        :first="first"
        :solved="solved"
        :total="total"
        :level-ids="levelIds"
      />
      <!-- The rules in one line, until the first solve: the game teaches the rest. -->
      <p
        v-if="!known || solved === 0"
        class="max-w-prose text-body text-muted-foreground"
      >
        Push every box onto a goal. You can only push, never pull, one box at a
        time. {{ total }} levels, no sign-up.
      </p>
      <section
        v-for="section in sections"
        :key="section.collection.id"
        :aria-labelledby="`collection-${section.collection.id}`"
        class="flex flex-col gap-6"
      >
        <div class="flex items-end justify-between gap-4 border-b pb-2">
          <div class="min-w-0">
            <h2 :id="`collection-${section.collection.id}`" class="text-title">
              {{ section.collection.title }}
            </h2>
            <p v-if="section.collection.author" class="text-small text-muted-foreground">
              By {{ section.collection.author }}
            </p>
          </div>
          <p class="shrink-0 font-mono text-label text-muted-foreground">
            <template v-if="known">
              {{ section.solved }} of {{ section.levels.length }} solved
            </template>
            <template v-else>{{ section.levels.length }} levels</template>
          </p>
        </div>
        <LevelPath
          :levels="section.levels"
          :states="view.states"
          :best="view.best"
          :remember="!cardOpen"
        />
        <component
          :is="'script'"
          v-if="placeOnLoad && section.levels.some((l) => l.id === next?.id)"
          :innerHTML="placeScript"
        />
        <p
          v-if="section.collection.credit"
          class="text-small text-muted-foreground"
        >
          {{ section.collection.credit }}
        </p>
      </section>
    </div>
    <NuxtPage />
  </div>
</template>
