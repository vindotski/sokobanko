<script setup lang="ts">
import { PlayIcon, ShuffleIcon, TrophyIcon } from "@lucide/vue";
import type { LevelJson } from "@sokobanko/core";

type Shown = LevelJson & { number: number; collectionTitle?: string };

/**
 * The map's first thing: one tap into the game. Every version has the same
 * shape (three lines, a button and a square on the right), so the map below
 * doesn't move when the player's progress turns one into another. Before the
 * progress is known (a first visit, or on the server) it shows the first
 * level, and Play goes to /play, which picks the level up next.
 */
const props = defineProps<{
  ready: boolean;
  /** The level up next, first in play order; none once all are solved. */
  next?: Shown;
  /** The first level, shown until the progress is known. */
  first?: Shown;
  solved: number;
  total: number;
  /** For "Random level" once everything is solved. */
  levelIds: string[];
}>();

const titleId = useId();
const shown = computed(() => (props.ready ? props.next : props.first));

function playRandom() {
  const id = props.levelIds[Math.floor(Math.random() * props.levelIds.length)];
  if (id) navigateTo(`/play/${id}`);
}
</script>

<template>
  <section
    :aria-labelledby="titleId"
    class="flex items-center gap-4 border bg-card p-4"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-col">
        <template v-if="shown">
          <p class="text-label text-muted-foreground">
            {{ ready && solved ? "Continue" : "Start here" }}
          </p>
          <h2 :id="titleId" class="truncate text-title">{{ shown.title }}</h2>
          <p class="truncate text-small text-muted-foreground">
            {{ shown.collectionTitle }} · Level {{ shown.number }}
          </p>
        </template>
        <template v-else>
          <p class="text-label text-muted-foreground">
            All {{ total }} levels
          </p>
          <h2 :id="titleId" class="truncate text-title">All solved</h2>
          <p class="truncate text-small text-muted-foreground">
            Now beat your bests
          </p>
        </template>
      </div>
      <Button v-if="shown" size="lg" as-child class="self-start">
        <NuxtLink :to="ready ? `/play/${shown.id}` : '/play'">
          <PlayIcon data-icon="inline-start" />
          Play
        </NuxtLink>
      </Button>
      <Button v-else size="lg" class="self-start" @click="playRandom">
        <ShuffleIcon data-icon="inline-start" />
        Random level
      </Button>
    </div>
    <div
      class="flex aspect-square w-24 shrink-0 items-center justify-center bg-muted p-2 sm:w-32"
      aria-hidden="true"
    >
      <LevelPreview v-if="shown" :level="shown" />
      <TrophyIcon v-else class="size-10" />
    </div>
  </section>
</template>
