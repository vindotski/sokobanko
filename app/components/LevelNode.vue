<script setup lang="ts">
import { CheckIcon, LockIcon } from "@lucide/vue";
import type { LevelState } from "@sokoban/core";

/**
 * One level on the map: a 56px square with its number, linking to its card.
 * Solved levels are filled with a tick, the one up next is larger with a
 * heavy outline, locked ones are faint with a lock. No state (`undefined`)
 * on the server and until the browser has read the player's progress.
 */
const props = defineProps<{
  level: { id: string; title: string; number: number };
  state?: LevelState;
  best?: { moves: number };
}>();

const label = computed(() => {
  const name = `Level ${props.level.number}, ${props.level.title}`;
  if (props.state === "solved" && props.best) {
    return `${name}, solved in ${props.best.moves} moves`;
  }
  if (props.state === "current") return `${name}, up next`;
  if (props.state === "locked") return `${name}, locked`;
  return name;
});
</script>

<template>
  <NuxtLink
    :to="`/levels/${level.id}`"
    :aria-label="label"
    :data-state="state"
    :data-current="state === 'current' || undefined"
    class="group relative flex size-14 items-center justify-center border bg-background font-mono text-body font-semibold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=current]:scale-110 data-[state=current]:border-[3px] data-[state=current]:border-foreground data-[state=locked]:text-muted-foreground data-[state=locked]:border-dashed data-[state=solved]:border-foreground data-[state=solved]:bg-foreground data-[state=solved]:text-background"
  >
    {{ level.number }}
    <CheckIcon
      v-if="state === 'solved'"
      class="absolute top-0.5 right-0.5 size-3.5"
      aria-hidden="true"
    />
    <LockIcon
      v-else-if="state === 'locked'"
      class="absolute top-0.5 right-0.5 size-3"
      aria-hidden="true"
    />
    <!-- The level up next breathes, unless the system asks for less motion. -->
    <span
      v-if="state === 'current'"
      class="pointer-events-none absolute -inset-1.5 border border-foreground motion-safe:animate-ping motion-reduce:hidden [animation-duration:2s]"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
