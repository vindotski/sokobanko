<script setup lang="ts">
import { SettingsIcon } from "@lucide/vue";

// A page's title, with Settings on phones (on wider screens it's in the
// sidebar). Stays at the top while the page scrolls.
defineProps<{ title: string; subtitle?: string }>();
const settingsOpen = useSettingsOpen();
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b bg-background pt-[env(safe-area-inset-top)]"
  >
    <div class="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
      <div class="flex min-w-0 flex-col py-2">
        <h1 class="truncate text-lead font-semibold">{{ title }}</h1>
        <p v-if="subtitle" class="truncate text-small text-muted-foreground">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <slot name="actions" />
        <Button
          variant="ghost"
          size="icon"
          class="md:hidden"
          aria-label="Settings"
          aria-haspopup="dialog"
          @click="settingsOpen = true"
        >
          <SettingsIcon />
        </Button>
      </div>
    </div>
  </header>
</template>
