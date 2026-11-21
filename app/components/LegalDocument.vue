<script setup lang="ts">
// Renders a document from @kodentuzo/spotstrap/blocks: a title, then sections of paragraphs and
// lists. Text is escaped by Vue; links are the only markup, and only http(s) and mailto ones.
import type { Doc, Inline } from "@kodentuzo/spotstrap/blocks";

defineProps<{ doc: Doc }>();

const href = (part: Inline) =>
  typeof part !== "string" && /^(https?:|mailto:)/.test(part.href)
    ? part.href
    : undefined;
const external = (part: Inline) =>
  typeof part !== "string" && /^https?:/.test(part.href);
const text = (part: Inline) => (typeof part === "string" ? part : part.text);
</script>

<template>
  <article class="mx-auto w-full max-w-2xl space-y-8 text-sm leading-relaxed">
    <header v-if="doc.title || doc.intro" class="space-y-2">
      <h1 v-if="doc.title" class="text-2xl font-semibold tracking-tight">{{ doc.title }}</h1>
      <p v-if="doc.intro" class="text-muted-foreground">
        <template v-for="(part, i) in doc.intro" :key="i">
          <a v-if="href(part)" :href="href(part)" class="underline underline-offset-4">{{ text(part) }}</a>
          <template v-else>{{ part }}</template>
        </template>
      </p>
    </header>
    <section v-for="section in doc.sections" :id="section.id" :key="section.id" class="space-y-3">
      <h2 class="text-base font-semibold">{{ section.heading }}</h2>
      <template v-for="(block, b) in section.blocks" :key="b">
        <p v-if="block.type === 'paragraph'">
          <template v-for="(part, i) in block.content" :key="i">
            <a
              v-if="href(part)"
              :href="href(part)"
              :rel="external(part) ? 'noopener noreferrer' : undefined"
              class="underline underline-offset-4"
            >{{ text(part) }}</a>
            <template v-else>{{ part }}</template>
          </template>
        </p>
        <ul v-else class="list-disc space-y-1 ps-5">
          <li v-for="(item, l) in block.items" :key="l">
            <template v-for="(part, i) in item" :key="i">
              <a
                v-if="href(part)"
                :href="href(part)"
                :rel="external(part) ? 'noopener noreferrer' : undefined"
                class="underline underline-offset-4"
              >{{ text(part) }}</a>
              <template v-else>{{ part }}</template>
            </template>
          </li>
        </ul>
      </template>
    </section>
    <footer v-if="doc.footer" class="border-t pt-4 text-muted-foreground">
      <template v-for="(part, i) in doc.footer" :key="i">{{ text(part) }}</template>
    </footer>
  </article>
</template>
