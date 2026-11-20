<script setup lang="ts">
import { levelStates, parseLevel } from "@sokoban/core";
import type { CarouselApi } from "~/components/ui/carousel";

const progress = useProgressStore();
const { data: levels } = await useLevels();
const { data: collections } = await useCollections();
await useAsyncData("completions", () => progress.load());

// Levels unlock in play order; the server enforces the same rule.
const states = computed(() =>
  levelStates(
    (levels.value ?? []).map((l) => l.id),
    (id) => id in progress.best,
  ),
);

const cards = computed(() =>
  (levels.value ?? []).map((level) => {
    const parsed = parseLevel(level);
    return {
      level,
      boxes: parsed.boxes.reduce((n, box) => n + box, 0),
      best: progress.best[level.id],
      state: states.value.get(level.id),
    };
  }),
);
// One row per collection, in play order.
const sections = computed(() =>
  (collections.value ?? [])
    .map((collection) => {
      const own = cards.value.filter(
        (c) => c.level.collection === collection.id,
      );
      const current = own.findIndex((c) => c.state === "current");
      const lastSolved = own.findLastIndex((c) => c.best);
      return {
        collection,
        cards: own,
        solved: own.filter((c) => c.best).length,
        // Where the row opens: the level up next, else the last one solved.
        start: current >= 0 ? current : Math.max(lastSolved, 0),
      };
    })
    .filter((section) => section.cards.length),
);

/**
 * Scrolls a row to the snap that shows a card, without animating. Rows trim
 * their snaps at the end, so a card's index isn't always its snap's.
 */
function openAt(api: CarouselApi, card: number) {
  if (!api || card === 0) return;
  const snap = api
    .internalEngine()
    .slideRegistry.findIndex((cards) => cards.includes(card));
  if (snap > 0) api.scrollTo(snap, true);
}
const solvedCount = computed(() => cards.value.filter((c) => c.best).length);
const solvedPercent = computed(() =>
  cards.value.length ? (solvedCount.value / cards.value.length) * 100 : 0,
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-title">Levels</h1>
        <p class="text-sm text-muted-foreground">
          Pick a puzzle. Your best result is saved when you solve it.
        </p>
      </div>
      <div v-if="cards.length" class="flex items-center gap-3">
        <span class="text-label whitespace-nowrap text-muted-foreground">
          {{ solvedCount }} of {{ cards.length }} solved
        </span>
        <Progress :model-value="solvedPercent" class="w-32" />
      </div>
    </div>

    <div v-if="sections.length" class="flex flex-col gap-10">
      <section
        v-for="section in sections"
        :key="section.collection.id"
        class="flex flex-col gap-4"
      >
        <Carousel
          :opts="{ align: 'start', containScroll: 'trimSnaps' }"
          :aria-labelledby="`collection-${section.collection.id}`"
          class="flex flex-col gap-4"
          @init-api="(api) => openAt(api, section.start)"
        >
          <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div class="flex flex-col gap-1">
              <h2 :id="`collection-${section.collection.id}`" class="text-lead font-semibold">
                {{ section.collection.title }}
              </h2>
              <p
                v-if="section.collection.author"
                class="text-sm text-muted-foreground"
              >
                By {{ section.collection.author }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-label whitespace-nowrap text-muted-foreground">
                {{ section.solved }} of {{ section.cards.length }} solved
              </span>
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </div>
          <!-- Padding keeps the current card's 2px ring inside the row's clip. -->
          <CarouselContent class="p-0.5">
            <CarouselItem
              v-for="card in section.cards"
              :key="card.level.id"
              class="basis-[85%] sm:basis-1/2 md:basis-1/3"
            >
              <LevelCard
                :level="card.level"
                :boxes="card.boxes"
                :best="card.best"
                :state="card.state"
              />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
        <p
          v-if="section.collection.credit"
          class="text-xs text-muted-foreground"
        >
          {{ section.collection.credit }}
        </p>
      </section>
    </div>

    <Empty v-else class="border">
      <EmptyHeader>
        <EmptyTitle>No levels yet</EmptyTitle>
        <EmptyDescription>Published levels will show up here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
</template>
