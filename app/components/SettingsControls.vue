<script setup lang="ts">
import { Volume2Icon, VolumeXIcon } from "@lucide/vue";

/**
 * Theme and sound, as 44px controls: in the Settings sheet and the game's
 * pause sheet.
 */
const colorMode = useColorMode();
const sound = useSound();
const soundOn = computed(() => sound.enabled.value);
</script>

<template>
  <div class="flex flex-col gap-6">
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-label text-muted-foreground">Theme</legend>
      <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
        <Button
          v-for="option in themeOptions"
          :key="option.value"
          role="radio"
          :aria-checked="colorMode.preference === option.value"
          :variant="colorMode.preference === option.value ? 'default' : 'outline'"
          @click="colorMode.preference = option.value"
        >
          <component :is="option.icon" data-icon="inline-start" />
          {{ option.label }}
        </Button>
      </div>
    </fieldset>
    <div class="flex flex-col gap-2">
      <span id="sound-label" class="text-label text-muted-foreground">Sound</span>
      <Button
        variant="outline"
        role="switch"
        :aria-checked="soundOn"
        aria-labelledby="sound-label"
        class="justify-between"
        @click="sound.setEnabled(!soundOn)"
      >
        <span class="flex items-center gap-2">
          <Volume2Icon v-if="soundOn" />
          <VolumeXIcon v-else />
          {{ soundOn ? "On" : "Off" }}
        </span>
        <span class="text-label text-muted-foreground">
          {{ soundOn ? "Tap to mute" : "Tap to turn on" }}
        </span>
      </Button>
    </div>
  </div>
</template>
