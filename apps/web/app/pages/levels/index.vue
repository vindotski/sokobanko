<script setup lang="ts">
import { CheckIcon } from "@lucide/vue";
import { parseLevel } from "@sokobanko/core";

const progress = useProgressStore();
const user = useSupabaseUser();
const { data: levels } = await useLevels();
// Reload when the session changes, e.g. once anonymous sign-in finishes.
await useAsyncData("completions", () => progress.load(), {
  watch: [() => user.value?.sub],
});

const cards = computed(() =>
  (levels.value ?? []).map((level, index) => {
    const parsed = parseLevel(level);
    return {
      level,
      number: index + 1,
      boxes: parsed.boxes.reduce((n, box) => n + box, 0),
      best: progress.best[level.id],
    };
  }),
);
const solvedCount = computed(() => cards.value.filter((c) => c.best).length);
const solvedPercent = computed(() =>
  cards.value.length ? (solvedCount.value / cards.value.length) * 100 : 0,
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Levels</h1>
        <p class="text-sm text-muted-foreground">
          Pick a puzzle. Your best result is saved when you solve it.
        </p>
      </div>
      <div v-if="cards.length" class="flex items-center gap-3">
        <span class="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {{ solvedCount }} of {{ cards.length }} solved
        </span>
        <Progress :model-value="solvedPercent" class="w-32" />
      </div>
    </div>

    <ItemGroup
      v-if="cards.length"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
    >
      <Item
        v-for="card in cards"
        :key="card.level.id"
        as-child
        variant="outline"
        role="listitem"
      >
        <!-- Pack the wrapped rows at the top, so previews and text line up
             across cards of equal height. -->
        <NuxtLink :to="`/play/${card.level.id}`" class="content-start">
          <ItemHeader
            class="relative flex aspect-4/3 items-center justify-center rounded-sm bg-muted bg-tile-grid p-4"
          >
            <LevelPreview :level="card.level" />
            <Badge v-if="card.best" class="absolute top-2 right-2">
              <CheckIcon />
              {{ card.best.moves }} moves
            </Badge>
          </ItemHeader>
          <ItemContent class="min-w-0">
            <ItemTitle class="w-full">
              <span class="truncate">{{ card.level.title }}</span>
            </ItemTitle>
            <ItemDescription class="truncate tabular-nums">
              Level {{ card.number }} · {{ card.boxes }}
              {{ card.boxes === 1 ? "box" : "boxes" }}
            </ItemDescription>
          </ItemContent>
        </NuxtLink>
      </Item>
    </ItemGroup>

    <Empty v-else class="border">
      <EmptyHeader>
        <EmptyTitle>No levels yet</EmptyTitle>
        <EmptyDescription>Published levels will show up here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
</template>
