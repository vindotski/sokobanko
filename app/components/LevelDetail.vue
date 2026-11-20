<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  PlayIcon,
  XIcon,
} from "@lucide/vue";
import type { LevelJson, LevelState } from "@sokobanko/core";

/**
 * A level's card, like a level-start screen: the board, where it sits, how
 * many boxes, your best or why it's locked, and one big Play.
 */
defineProps<{
  level: LevelJson & { number: number };
  collectionTitle?: string;
  collectionSize: number;
  boxes: number;
  /** Unknown until the browser has read the player's progress. */
  state?: LevelState;
  best?: { moves: number; pushes: number };
  unsynced?: boolean;
  /** The level that unlocks this one, when it's locked. */
  unlocker?: { id: string; title: string };
  previous?: { id: string; title: string };
  next?: { id: string; title: string };
}>();
</script>

<template>
  <article aria-labelledby="level-title" class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          :disabled="!previous"
          :as-child="!!previous"
          :aria-label="previous ? `Previous level, ${previous.title}` : 'No previous level'"
        >
          <NuxtLink v-if="previous" :to="`/levels/${previous.id}`" replace>
            <ChevronLeftIcon />
          </NuxtLink>
          <ChevronLeftIcon v-else />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :disabled="!next"
          :as-child="!!next"
          :aria-label="next ? `Next level, ${next.title}` : 'No next level'"
        >
          <NuxtLink v-if="next" :to="`/levels/${next.id}`" replace>
            <ChevronRightIcon />
          </NuxtLink>
          <ChevronRightIcon v-else />
        </Button>
      </div>
      <Button variant="ghost" size="icon" as-child aria-label="Close">
        <NuxtLink to="/"><XIcon /></NuxtLink>
      </Button>
    </div>

    <!-- Capped on phones, so Play stays within reach below it. -->
    <div
      class="flex aspect-4/3 max-h-[32dvh] w-full items-center justify-center bg-muted bg-tile-grid p-4 lg:max-h-none lg:p-6"
    >
      <LevelPreview :level="level" :frame-aspect="4 / 3" />
    </div>

    <div class="flex flex-col gap-1">
      <p class="text-label text-muted-foreground">
        {{ collectionTitle }} · Level {{ level.number }} of {{ collectionSize }}
      </p>
      <h2 id="level-title" tabindex="-1" class="text-title outline-none">
        {{ level.title }}
      </h2>
      <p class="text-small text-muted-foreground">
        {{ boxes }} {{ boxes === 1 ? "box" : "boxes" }} to put on goals
      </p>
    </div>

    <div class="min-h-6 text-body" aria-live="polite">
      <p v-if="state === 'solved' && best" class="font-mono">
        Your best: {{ best.moves }} moves · {{ best.pushes }} pushes
        <Badge v-if="unsynced" variant="outline" class="ml-1 font-sans">
          Not synced yet
        </Badge>
      </p>
      <p v-else-if="state === 'current'">Up next. Your first try.</p>
      <p v-else-if="state === 'locked'" class="flex items-start gap-2">
        <LockIcon class="mt-1 size-4 shrink-0" aria-hidden="true" />
        <span>
          Locked. Solve
          <NuxtLink
            v-if="unlocker"
            :to="`/levels/${unlocker.id}`"
            class="font-medium underline underline-offset-4"
          >
            {{ unlocker.title }}
          </NuxtLink>
          first.
        </span>
      </p>
    </div>

    <Button v-if="state === 'locked'" size="lg" disabled class="w-full">
      <LockIcon data-icon="inline-start" />
      Locked
    </Button>
    <Button v-else size="lg" as-child class="w-full">
      <NuxtLink :to="`/play/${level.id}`">
        <PlayIcon data-icon="inline-start" />
        Play
      </NuxtLink>
    </Button>
  </article>
</template>
