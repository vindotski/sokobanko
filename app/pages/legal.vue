<script setup lang="ts">
/**
 * The legal notice: who runs Sokobanko and how to reach them. The address
 * comes from settings (NUXT_PUBLIC_LEGAL_ADDRESS), never the repository.
 */
usePageSeo({
  title: "Legal notice · Sokobanko",
  description: "Who runs Sokobanko, and how to reach them.",
  path: "/legal",
});
const legal = useLegal();
</script>

<template>
  <LegalArticle title="Legal notice">
    <h2>Run by</h2>
    <address class="not-italic">
      {{ legal.name }}<br />
      <template v-for="line in legal.address" :key="line">{{ line }}<br /></template>
      {{ legal.country }}
    </address>
    <p v-if="!legal.address.length" class="text-muted-foreground">
      The postal address is available on request, by email.
    </p>

    <h2>Contact</h2>
    <p>
      Email: <a :href="`mailto:${legal.email}`">{{ legal.email }}</a>
    </p>

    <h2>Responsible for the content</h2>
    <p>{{ legal.name }}, at the address above.</p>

    <h2>Not a business</h2>
    <p>
      Sokobanko is a free, non-commercial project: no payments, ads or
      purchases. How it handles personal data is in the
      <NuxtLink to="/privacy">privacy policy</NuxtLink>, and the rules for
      playing are in the <NuxtLink to="/terms">terms of use</NuxtLink>.
    </p>
  </LegalArticle>
</template>
