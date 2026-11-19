<script setup lang="ts">
const { version } = useRuntimeConfig().public;

const linkClass = "hover:text-foreground hover:underline";
</script>

<template>
  <footer
    class="flex flex-col items-center gap-3 px-4 py-4 text-sm text-muted-foreground sm:py-6"
  >
    <div class="flex items-center gap-3">
      <Avatar class="size-8">
        <!-- Greyscale, like the rest of the black and white design. -->
        <AvatarImage
          src="/vinski.jpg"
          alt="Vinski&amp;Friends"
          class="grayscale"
        />
        <AvatarFallback>VF</AvatarFallback>
      </Avatar>
      <p>
        Made by
        <a
          href="https://www.vin.ski"
          aria-label="Ivan Vinski"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-foreground hover:underline"
        >
          Vinski&amp;Friends
        </a>
        in Croatia
      </p>
    </div>
    <nav
      aria-label="Footer"
      class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
    >
      <NuxtLink to="/privacy" :class="linkClass">Privacy</NuxtLink>
      <NuxtLink to="/faq" :class="linkClass">FAQ</NuxtLink>
      <a
        href="mailto:ivan@vin.ski?subject=Sokobanko%20feedback"
        :class="linkClass"
        >Feedback</a
      >
      <span class="font-mono text-xs">v{{ version }}</span>
    </nav>
  </footer>
</template>
