<script setup lang="ts">
import { CheckIcon, LockIcon, PlayIcon } from "@lucide/vue";
import { levelStates, parseLevel } from "@sokoban/core";

const progress = useProgressStore();
const token = useSessionToken();
const { data: levels } = await useLevels();
// Reload when the session changes, e.g. once anonymous sign-in finishes.
await useAsyncData("completions", () => progress.load(), {
  watch: [token],
});

// Levels unlock in play order; the server enforces the same rule.
const states = computed(() =>
  levelStates(
    (levels.value ?? []).map((l) => l.id),
    (id) => id in progress.best,
  ),
);

const cards = computed(() =>
  (levels.value ?? []).map((level, index) => {
    const parsed = parseLevel(level);
    return {
      level,
      number: index + 1,
      boxes: parsed.boxes.reduce((n, box) => n + box, 0),
      best: progress.best[level.id],
      state: states.value.get(level.id),
    };
  }),
);
// Locked cards aren't links.
const NuxtLink = resolveComponent("NuxtLink");
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

    <ItemGroup
      v-if="cards.length"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
    >
      <!-- The current level stands out; locked ones are dimmed. -->
      <Item
        v-for="card in cards"
        :key="card.level.id"
        as-child
        variant="outline"
        role="listitem"
        :class="{
          'ring-2 ring-primary': card.state === 'current',
          'opacity-50': card.state === 'locked',
        }"
      >
        <!-- Pack the wrapped rows at the top, so previews and text line up
             across cards of equal height. -->
        <component
          :is="card.state === 'locked' ? 'div' : NuxtLink"
          :to="card.state === 'locked' ? undefined : `/play/${card.level.id}`"
          :aria-disabled="card.state === 'locked' || undefined"
          class="content-start"
        >
          <ItemHeader
            class="relative flex aspect-4/3 items-center justify-center rounded-sm bg-muted bg-tile-grid p-4"
          >
            <LevelPreview :level="card.level" />
            <Badge v-if="card.best" class="absolute top-2 right-2">
              <CheckIcon />
              {{ card.best.moves }} moves
            </Badge>
            <Badge
              v-else-if="card.state === 'current'"
              class="absolute top-2 right-2"
            >
              <PlayIcon />
              Up next
            </Badge>
            <Badge
              v-else-if="card.state === 'locked'"
              variant="secondary"
              class="absolute top-2 right-2"
            >
              <LockIcon />
              Locked
            </Badge>
          </ItemHeader>
          <ItemContent class="min-w-0">
            <ItemTitle class="w-full">
              <span class="truncate">{{ card.level.title }}</span>
            </ItemTitle>
            <ItemDescription class="truncate text-label">
              Level {{ card.number }} · {{ card.boxes }}
              {{ card.boxes === 1 ? "box" : "boxes" }}
            </ItemDescription>
          </ItemContent>
        </component>
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
