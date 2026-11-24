<script setup lang="ts">
/**
 * The way to the privacy notice, terms and legal notice, from any page.
 * `label` names the landmark, so two on one page (the sidebar's and the
 * page's own) can be told apart.
 */
withDefaults(defineProps<{ label?: string }>(), { label: "Legal" });
const links = [
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/legal", label: "Legal notice" },
];
</script>

<template>
  <nav :aria-label="label">
    <ul class="flex flex-wrap gap-x-4 gap-y-1 text-small text-muted-foreground">
      <li v-for="link in links" :key="link.to">
        <NuxtLink
          :to="link.to"
          class="underline-offset-4 hover:text-foreground hover:underline"
        >
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
