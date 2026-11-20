<script setup lang="ts">
import { SettingsIcon } from "@lucide/vue";

// Tablets and desktops: the same sections as the phones' tab bar, down the
// side. A narrow rail with labels under the icons from md, a full sidebar
// from lg. Settings sits at the bottom, as it isn't a section.
const route = useRoute();
const settingsOpen = useSettingsOpen();
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-20 flex-col border-r bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:w-64"
  >
    <NuxtLink
      to="/"
      class="flex h-16 items-center justify-center px-4 font-semibold lg:justify-start lg:text-lead"
      aria-label="Sokobanko, home"
    >
      <span class="lg:hidden" aria-hidden="true">S</span>
      <span class="hidden lg:inline">Sokobanko</span>
    </NuxtLink>
    <nav aria-label="Sections" class="flex-1 px-2">
      <ul class="flex flex-col gap-1">
        <li v-for="section in sections" :key="section.to">
          <NuxtLink
            :to="section.to"
            :aria-current="inSection(section.to, route.path) ? 'page' : undefined"
            class="flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-[current=page]:bg-accent aria-[current=page]:font-semibold aria-[current=page]:text-foreground lg:min-h-control lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-body"
          >
            <component :is="section.icon" class="size-6 lg:size-5" aria-hidden="true" />
            {{ section.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
    <div class="flex flex-col gap-1 border-t px-2 py-2">
      <button
        type="button"
        class="flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:min-h-control lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-body"
        aria-haspopup="dialog"
        @click="settingsOpen = true"
      >
        <SettingsIcon class="size-6 lg:size-5" aria-hidden="true" />
        Settings
      </button>
    </div>
  </aside>
</template>
