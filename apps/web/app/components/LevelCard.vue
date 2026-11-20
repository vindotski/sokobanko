<script setup lang="ts">
import { CheckIcon, LockIcon, PlayIcon } from "@lucide/vue";
import type { LevelJson, LevelState } from "@sokoban/core";

defineProps<{
  /** A level from /api/levels, with its number in its collection. */
  level: LevelJson & { number: number };
  boxes: number;
  best?: { moves: number };
  state?: LevelState;
}>();

// Locked cards aren't links.
const NuxtLink = resolveComponent("NuxtLink");
</script>

<template>
  <!-- The current level stands out; locked ones are dimmed. -->
  <Item
    as-child
    variant="outline"
    :class="{
      'ring-2 ring-primary': state === 'current',
      'opacity-50': state === 'locked',
    }"
  >
    <!-- Pack the wrapped rows at the top, so previews and text line up
         across cards of equal height. -->
    <component
      :is="state === 'locked' ? 'div' : NuxtLink"
      :to="state === 'locked' ? undefined : `/play/${level.id}`"
      :aria-disabled="state === 'locked' || undefined"
      class="h-full content-start"
    >
      <ItemHeader
        class="relative flex aspect-4/3 items-center justify-center rounded-sm bg-muted bg-tile-grid p-4"
      >
        <LevelPreview :level="level" />
        <Badge v-if="best" class="absolute top-2 right-2">
          <CheckIcon />
          {{ best.moves }} moves
        </Badge>
        <Badge
          v-else-if="state === 'current'"
          class="absolute top-2 right-2"
        >
          <PlayIcon />
          Up next
        </Badge>
        <Badge
          v-else-if="state === 'locked'"
          variant="secondary"
          class="absolute top-2 right-2"
        >
          <LockIcon />
          Locked
        </Badge>
      </ItemHeader>
      <ItemContent class="min-w-0">
        <ItemTitle class="w-full">
          <span class="truncate">{{ level.title }}</span>
        </ItemTitle>
        <ItemDescription class="truncate text-label">
          Level {{ level.number }} · {{ boxes }}
          {{ boxes === 1 ? "box" : "boxes" }}
        </ItemDescription>
      </ItemContent>
    </component>
  </Item>
</template>
