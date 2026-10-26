<script setup lang="ts">
import { ShuffleIcon, TrophyIcon } from "@lucide/vue";

definePageMeta({ layout: "play" });

// /play without an id: jump to the first level in play order that the user
// hasn't solved yet, or congratulate them once everything is solved.
const { data: levels } = await useLevels();
const best = await useProgressStore().load();
const all = levels.value ?? [];
const next = all.find((level) => !(level.id in best));

if (next) {
  await navigateTo(`/play/${next.id}`, { replace: true });
} else if (!all.length) {
  await navigateTo("/levels", { replace: true });
}

const totals = all.reduce(
  (sum, level) => ({
    moves: sum.moves + (best[level.id]?.moves ?? 0),
    pushes: sum.pushes + (best[level.id]?.pushes ?? 0),
  }),
  { moves: 0, pushes: 0 },
);

function playRandom() {
  const level = all[Math.floor(Math.random() * all.length)];
  if (level) navigateTo(`/play/${level.id}`);
}
</script>

<template>
  <div
    class="flex flex-1 items-center justify-center bg-tile-grid px-4 py-8 [--tile-grid-size:24px]"
  >
    <!-- A solid card keeps the text readable over the grid. -->
    <Card class="w-full max-w-md py-8">
      <CardContent>
        <Empty class="p-0 md:p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrophyIcon />
            </EmptyMedia>
            <EmptyTitle>You solved every level!</EmptyTitle>
            <EmptyDescription>
              All {{ all.length }} levels done in {{ totals.moves }} moves and
              {{ totals.pushes }} pushes, counting your best on each. New levels
              are on the way.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button @click="playRandom">
              <ShuffleIcon data-icon="inline-start" />
              Random level
            </Button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  </div>
</template>
