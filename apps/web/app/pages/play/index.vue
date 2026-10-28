<script setup lang="ts">
import { TrophyIcon } from "@lucide/vue";

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

// Square confetti in the board's foreground color to celebrate: from both
// bottom corners, then the middle. The library skips it when the system asks for reduced motion.
let confetti: typeof import("canvas-confetti") | undefined;
let finale: ReturnType<typeof setTimeout> | undefined;
onMounted(async () => {
  const { default: fire } = await import("canvas-confetti");
  confetti = fire;
  const { player } = readBoardPalette();
  const shared = {
    particleCount: 80,
    spread: 60,
    startVelocity: 55,
    shapes: ["square" as const],
    colors: player ? [player] : undefined,
    disableForReducedMotion: true,
  };
  fire({ ...shared, angle: 60, origin: { x: 0, y: 1 } });
  fire({ ...shared, angle: 120, origin: { x: 1, y: 1 } });
  finale = setTimeout(() => {
    fire({ ...shared, particleCount: 120, spread: 100, origin: { y: 0.7 } });
  }, 250);
});
onBeforeUnmount(() => {
  clearTimeout(finale);
  confetti?.reset();
});
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
            <!-- Everything is solved here, so this is "Random level". -->
            <PlayButton />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  </div>
</template>
