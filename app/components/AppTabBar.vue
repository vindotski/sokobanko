<script setup lang="ts">
// Phones: the app's sections along the bottom, within thumb reach, above the
// home indicator. Always visible; only sheets cover it. Its height is set,
// so it doesn't grow as the page streams in.
const route = useRoute();
</script>

<template>
  <nav
    aria-label="Sections"
    class="fixed inset-x-0 bottom-0 z-40 min-h-[calc(3.5rem+1px+env(safe-area-inset-bottom))] border-t bg-background pb-[env(safe-area-inset-bottom)]"
  >
    <ul class="mx-auto grid max-w-md grid-cols-3">
      <li v-for="section in sections" :key="section.to">
        <NuxtLink
          :to="section.to"
          :aria-current="inSection(section.to, route.path) ? 'page' : undefined"
          class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
        >
          <component :is="section.icon" class="size-6" aria-hidden="true" />
          {{ section.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
