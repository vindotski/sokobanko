<script setup lang="ts">
import { KeyboardIcon, SettingsIcon } from "@lucide/vue";

// The game's settings: sound, the theme, and the controls help.
const emit = defineEmits<{ help: [] }>();

const sound = useSound();
const colorMode = useColorMode();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon-sm" aria-label="Settings" title="Settings">
        <SettingsIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" side="top">
      <DropdownMenuCheckboxItem
        :model-value="sound.enabled.value"
        @update:model-value="sound.setEnabled($event)"
      >
        Sound
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup v-model="colorMode.preference">
        <DropdownMenuRadioItem
          v-for="option in themeOptions"
          :key="option.value"
          :value="option.value"
        >
          <component :is="option.icon" />
          {{ option.label }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="emit('help')">
        <KeyboardIcon />
        Controls
        <DropdownMenuShortcut>?</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
