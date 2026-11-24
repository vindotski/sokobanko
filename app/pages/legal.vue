<script setup lang="ts">
import { legalNotice } from "@kodentuzo/spotstrap/blocks";

/**
 * The legal notice: who runs Sokoban and how to reach them, from the
 * instance's legal facts (the owner sets them on Spotcraft, never in the
 * repository).
 */
usePageSeo({
  title: "Legal notice · Sokoban",
  description: "Who runs Sokoban, and how to reach them.",
  path: "/legal",
});
const { facts, error, updated } = useLegalFacts();
// The page header already says "Legal notice".
const doc = computed(() =>
  facts.value ? { ...legalNotice(facts.value), title: "" } : null,
);
</script>

<template>
  <PageHeader title="Legal notice" :subtitle="updated ? `Last updated ${updated}` : undefined" />
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
    <LegalDocument v-if="doc" :doc="doc" />
    <p v-else-if="error" role="alert">
      The legal notice can't be shown right now.
    </p>
    <p class="mx-auto w-full max-w-2xl text-small text-muted-foreground">
      Sokoban is a free, non-commercial project: no payments, ads or
      purchases. How it handles personal data is in the
      <NuxtLink to="/privacy" class="underline underline-offset-4">privacy notice</NuxtLink>,
      and the rules for playing are in the
      <NuxtLink to="/terms" class="underline underline-offset-4">terms of use</NuxtLink>.
    </p>
  </div>
  <LegalLinks class="mx-auto w-full max-w-3xl px-4 pb-8" />
</template>
