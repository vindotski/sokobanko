<script setup lang="ts">
const route = useRoute();

const links = [
  { to: "/play", label: "Play" },
  { to: "/levels", label: "Levels" },
  { to: "/faq", label: "FAQ" },
];

// Matches subpages too, e.g. Play on /play/<id>. Vue Router's active class
// doesn't, because those are sibling routes rather than nested ones.
const isActive = (to: string) =>
  route.path === to || route.path.startsWith(`${to}/`);

const linkClass =
  "text-sm text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground";
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background">
    <!--
      Phones: one row, links on the right. From md: three columns, with the
      main links centred and Profile always on the far right.
    -->
    <nav
      class="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 md:grid md:grid-cols-[1fr_auto_1fr]"
    >
      <NuxtLink to="/" class="font-bold">Sokobanko</NuxtLink>
      <div class="ml-auto flex gap-4 md:ml-0">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="isActive(link.to) ? 'page' : undefined"
          :class="linkClass"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <NuxtLink
        to="/profile"
        :aria-current="isActive('/profile') ? 'page' : undefined"
        :class="linkClass"
        class="md:justify-self-end"
      >
        Profile
      </NuxtLink>
    </nav>
  </header>
</template>
