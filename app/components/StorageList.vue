<script setup lang="ts">
/**
 * Cookies or browser storage, for the privacy policy: each one's name, what
 * it's for and how long it lasts. A list rather than a table, so it reads on
 * a phone.
 */
defineProps<{
  items: { name: string; note?: string; purpose: string; lasts?: string }[];
}>();
</script>

<template>
  <dl class="flex flex-col divide-y border">
    <div v-for="item in items" :key="item.name" class="flex flex-col gap-1 p-3">
      <dt class="font-mono text-small font-semibold break-all">
        {{ item.name }}
        <span v-if="item.note" class="font-sans font-normal text-muted-foreground">
          ({{ item.note }})
        </span>
      </dt>
      <dd>{{ item.purpose }}</dd>
      <dd v-if="item.lasts" class="text-small text-muted-foreground">
        Kept: {{ item.lasts }}
      </dd>
    </div>
  </dl>
</template>
