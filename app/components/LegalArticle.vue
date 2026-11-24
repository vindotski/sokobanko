<script setup lang="ts">
/**
 * The frame of the privacy notice, terms and legal notice: a header with the
 * date they last changed, then readable prose (headings, paragraphs, lists
 * and links styled here, so the pages are plain markup).
 */
defineProps<{ title: string }>();
const updated = new Date(`${LEGAL_UPDATED}T00:00:00Z`).toLocaleDateString(
  "en-GB",
  { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
);
</script>

<template>
  <PageHeader :title="title" :subtitle="`Last updated ${updated}`" />
  <article
    class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 text-body [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-6 [&_h2]:text-title [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:max-w-prose [&_ul]:list-disc [&_ul]:pl-6"
  >
    <slot />
  </article>
  <LegalLinks class="mx-auto w-full max-w-3xl px-4 pb-8" />
</template>
