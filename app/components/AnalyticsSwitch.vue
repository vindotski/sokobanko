<script setup lang="ts">
// "Count my visits": shown wherever the instance counts visits for this app (opt-out and
// opt-in). Put it in Your data. Renders nothing in server mode, or before it knows.
import { analytics } from "@kodentuzo/spotkit/client";
import {
  type AnalyticsChoice,
  createAnalyticsChoice,
  en,
  type Messages,
} from "@kodentuzo/spotstrap/blocks";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const props = defineProps<{ messages?: Messages }>();
const t = computed(() => (props.messages ?? en).analytics.optOut);

const choice = shallowRef<AnalyticsChoice>();
const on = ref(false);
let stop = () => {};
onMounted(async () => {
  // Off Spotcraft, or with config.json unreachable, there's nothing to choose: render nothing.
  const counted = await analytics().catch(() => undefined);
  if (!counted) return;
  choice.value = createAnalyticsChoice(counted);
  on.value = choice.value.on;
  stop = choice.value.subscribe(() => {
    on.value = choice.value?.on ?? false;
  });
});
onBeforeUnmount(() => stop());
</script>

<template>
  <div v-if="choice?.switchVisible" class="flex items-start justify-between gap-4">
    <div class="space-y-1">
      <Label for="spotstrap-count-visits">{{ t.label }}</Label>
      <p class="text-sm text-muted-foreground">{{ t.help }}</p>
    </div>
    <Switch id="spotstrap-count-visits" :model-value="on" @update:model-value="(value: boolean) => choice?.setOn(value)" />
  </div>
</template>
