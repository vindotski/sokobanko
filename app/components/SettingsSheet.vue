<script setup lang="ts">
import { CircleHelpIcon, KeyboardIcon } from "@lucide/vue";
import { useMediaQuery } from "@vueuse/core";

/**
 * Settings, from any page: the theme, sound, and the way to the controls,
 * About and the legal pages. From the bottom on phones, within thumb reach; from the side
 * elsewhere.
 */
const open = useSettingsOpen();
const wide = useMediaQuery("(min-width: 768px)");
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :side="wide ? 'right' : 'bottom'"
      class="gap-0 pb-[env(safe-area-inset-bottom)]"
    >
      <SheetHeader class="border-b">
        <SheetTitle>Settings</SheetTitle>
        <SheetDescription class="sr-only">Theme, sound and help.</SheetDescription>
      </SheetHeader>
      <div class="flex flex-col gap-6 p-4">
        <SettingsControls />
        <div class="flex flex-col gap-2">
          <Button variant="outline" as-child @click="open = false">
            <NuxtLink to="/help#controls">
              <KeyboardIcon data-icon="inline-start" />
              Controls
            </NuxtLink>
          </Button>
          <Button variant="outline" as-child @click="open = false">
            <NuxtLink to="/help#about">
              <CircleHelpIcon data-icon="inline-start" />
              About Sokobanko
            </NuxtLink>
          </Button>
        </div>
        <LegalLinks @click="open = false" />
      </div>
    </SheetContent>
  </Sheet>
</template>
