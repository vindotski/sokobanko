<script setup lang="ts">
import { StarIcon } from "@lucide/vue";
import type { Stars } from "@sokoban/core";

/**
 * One to three stars, filled for those earned. The stars are drawn for
 * sight; screen readers hear the label instead.
 */
const props = withDefaults(
  defineProps<{ stars: Stars; size?: "sm" | "md" }>(),
  {
    size: "sm",
  },
);
</script>

<template>
  <span
    role="img"
    :aria-label="`${props.stars} of 3 stars`"
    class="inline-flex items-center gap-0.5"
  >
    <StarIcon
      v-for="i in 3"
      :key="i"
      aria-hidden="true"
      :class="[
        props.size === 'md' ? 'size-6' : 'size-3.5',
        i <= props.stars ? 'fill-current' : 'opacity-40',
      ]"
    />
  </span>
</template>
