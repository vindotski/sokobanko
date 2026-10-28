<script setup lang="ts">
import { ArrowRightIcon } from "@lucide/vue";

definePageMeta({ layout: "landing" });

const { data: levelIds } = await useLevelIds();
</script>

<template>
  <section
    class="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-8 text-center sm:gap-8 sm:py-24"
  >
    <div
      class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
    />
    <p
      class="rounded-full border px-3 py-1 text-sm text-muted-foreground"
    >
      A classic box-pushing puzzle
    </p>
    <h1 class="text-5xl font-bold tracking-tight sm:text-7xl">Sokoban</h1>
    <p class="max-w-xl text-lg text-muted-foreground sm:text-xl">
      Push every box onto a goal. You can't pull, so every move counts.
    </p>
    <div class="flex flex-col gap-3 sm:flex-row">
      <PlayButton size="lg" />
      <Button as-child size="lg" variant="outline">
        <NuxtLink to="/levels">
          Browse levels
          <ArrowRightIcon data-icon="inline-end" />
        </NuxtLink>
      </Button>
    </div>
    <p class="text-sm text-muted-foreground">
      {{ levelIds?.length ?? 0 }} levels and counting
    </p>
  </section>
</template>
