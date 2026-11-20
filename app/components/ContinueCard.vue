<script setup lang="ts">
import { PlayIcon, ShuffleIcon, TrophyIcon } from "@lucide/vue";
import type { LevelJson } from "@sokobanko/core";

/**
 * The map's first thing: one tap into the game. Before the browser has read
 * the player's progress (and on the server) it's a plain Play, which /play
 * turns into the next level.
 */
const props = defineProps<{
  ready: boolean;
  /** The level up next, first in play order; none once all are solved. */
  next?: LevelJson & { number: number; collectionTitle?: string };
  solved: number;
  total: number;
  /** For "Random level" once everything is solved. */
  levelIds: string[];
}>();

const titleId = useId();

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
    <template v-if="ready && next">
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div class="flex flex-col">
          <p class="text-label text-muted-foreground">
            {{ solved ? "Continue" : "Start here" }}
          </p>
          <h2 :id="titleId" class="truncate text-title">{{ next.title }}</h2>
          <p class="text-small text-muted-foreground">
            {{ next.collectionTitle }} · Level {{ next.number }}
          </p>
        </div>
        <Button size="lg" as-child class="self-start">
          <NuxtLink :to="`/play/${next.id}`">
            <PlayIcon data-icon="inline-start" />
            Play
          </NuxtLink>
        </Button>
      </div>
      <div
        class="flex aspect-square w-24 shrink-0 items-center justify-center bg-muted p-2 sm:w-32"
        aria-hidden="true"
      >
        <LevelPreview :level="next" />
      </div>
    </template>
    <template v-else-if="ready">
      <TrophyIcon class="size-10 shrink-0" aria-hidden="true" />
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h2 :id="titleId" class="text-title">Every level solved</h2>
          <p class="text-small text-muted-foreground">
            All {{ total }}. Replay any of them to beat your best.
          </p>
        </div>
        <Button size="lg" class="self-start" @click="playRandom">
          <ShuffleIcon data-icon="inline-start" />
          Random level
        </Button>
      </div>
    </template>
    <template v-else>
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <h2 :id="titleId" class="text-title">Ready to push some boxes?</h2>
        <Button size="lg" as-child class="self-start">
          <NuxtLink to="/play">
            <PlayIcon data-icon="inline-start" />
            Play
          </NuxtLink>
        </Button>
      </div>
    </template>
  </section>
</template>
