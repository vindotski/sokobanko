<script setup lang="ts">
import { ArrowRightIcon, CalendarDaysIcon, FlameIcon } from "@lucide/vue";

definePageMeta({ layout: "landing" });
usePageSeo({
  description:
    "A classic box-pushing puzzle. Push every box onto a goal: you can't pull, so every move counts. Free, in your browser.",
});

const { data: levelIds } = await useLevelIds();
// Today's puzzle number, and the player's streak if they have one.
const api = useApi();
const { data: daily } = await useAsyncData("daily", () =>
  api("/api/daily").catch(() => null),
);
const { data: myDaily } = await useAsyncData("my-daily-home", () =>
  api("/api/me/daily").catch(() => ({ today: null, streak: 0 })),
);
</script>

<template>
  <section
    class="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-8 text-center sm:gap-8 sm:py-24"
  >
    <div
      class="absolute inset-0 -z-10 bg-tile-grid [--tile-grid-size:48px] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
    />
    <p
      class="border px-3 py-1 text-label text-muted-foreground"
    >
      A classic box-pushing puzzle
    </p>
    <h1 class="text-display">Sokobanko</h1>
    <p class="max-w-xl text-lead text-muted-foreground">
      Push every box onto a goal. You can't pull, so every move counts.
    </p>
    <div class="flex flex-col gap-3 sm:flex-row">
      <PlayButton size="lg" />
      <Button v-if="daily" as-child size="lg" variant="outline">
        <NuxtLink to="/daily">
          <CalendarDaysIcon data-icon="inline-start" />
          Daily #{{ daily.number }}
          <template v-if="myDaily?.streak">
            <span class="inline-flex items-center" aria-hidden="true">
              <FlameIcon class="size-4" />{{ myDaily.streak }}
            </span>
            <span class="sr-only">, {{ myDaily.streak }}-day streak</span>
          </template>
        </NuxtLink>
      </Button>
      <Button as-child size="lg" variant="ghost">
        <NuxtLink to="/levels">
          Browse levels
          <ArrowRightIcon data-icon="inline-end" />
        </NuxtLink>
      </Button>
    </div>
    <p class="text-sm text-muted-foreground">
      {{ levelIds?.length ?? 0 }} levels and counting
    </p>
  </section>
</template>
