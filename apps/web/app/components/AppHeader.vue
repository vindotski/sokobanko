<script setup lang="ts">
const route = useRoute();

const links = [
  { to: "/play", label: "Play" },
  { to: "/levels", label: "Levels" },
  { to: "/profile", label: "Profile" },
  { to: "/faq", label: "FAQ" },
];

// Matches subpages too, e.g. Play on /play/<id>. Vue Router's active class
// doesn't, because those are sibling routes rather than nested ones.
const isActive = (to: string) =>
  route.path === to || route.path.startsWith(`${to}/`);
</script>

<template>
  <header class="border-b">
    <nav class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
      <NuxtLink to="/" class="font-bold">Sokobanko</NuxtLink>
      <div class="ml-auto flex gap-4 text-sm">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="isActive(link.to) ? 'page' : undefined"
          class="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>
