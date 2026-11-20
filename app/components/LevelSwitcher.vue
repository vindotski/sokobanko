<script setup lang="ts">
import { CheckIcon, LockIcon, PlayIcon } from "@lucide/vue";
import type { LevelJson, LevelState } from "@sokoban/core";
import { useMediaQuery } from "@vueuse/core";

/**
 * Pick another level without leaving the game: one collection at a time,
 * opening on the level being played. Locked levels are listed but aren't
 * links, as on the Levels page.
 */
const props = defineProps<{
  levels: (LevelJson & { collection: string; number: number })[];
  collections: { id: string; title: string }[];
  /** The level being played. */
  current: { id: string; collection: string };
  states: Map<string, LevelState>;
  best: Record<string, { moves: number } | undefined>;
}>();
const open = defineModel<boolean>("open", { required: true });

// From the bottom on phones, within thumb reach; from the side elsewhere.
const wide = useMediaQuery("(min-width: 640px)");

// The collection shown; back to the current one each time the sheet opens.
const shown = ref(props.current.collection);
const list = useTemplateRef("list");
watch(open, async (isOpen) => {
  if (!isOpen) return;
  shown.value = props.current.collection;
  // Once the sheet has rendered, bring the current level into view.
  await nextTick();
  requestAnimationFrame(() =>
    list.value
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "center" }),
  );
});

const rows = computed(() =>
  props.levels.filter((level) => level.collection === shown.value),
);
const solved = computed(
  () => rows.value.filter((level) => props.best[level.id]).length,
);

const NuxtLink = resolveComponent("NuxtLink");
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :side="wide ? 'right' : 'bottom'"
      class="max-h-[85dvh] gap-0 sm:max-h-none"
    >
      <SheetHeader class="gap-3 border-b">
        <SheetTitle>Levels</SheetTitle>
        <SheetDescription class="sr-only">
          Choose a level to play.
        </SheetDescription>
        <!-- One tab per collection, when there's more than one. -->
        <div
          v-if="collections.length > 1"
          role="tablist"
          aria-label="Collections"
          class="flex flex-wrap gap-2"
        >
          <Button
            v-for="collection in collections"
            :key="collection.id"
            role="tab"
            :aria-selected="shown === collection.id"
            :variant="shown === collection.id ? 'default' : 'outline'"
            size="sm"
            @click="shown = collection.id"
          >
            {{ collection.title }}
          </Button>
        </div>
        <p class="text-label text-muted-foreground">
          {{ solved }} of {{ rows.length }} solved
        </p>
      </SheetHeader>

      <ul ref="list" class="min-h-0 flex-1 overflow-y-auto p-2">
        <li v-for="level in rows" :key="level.id">
          <component
            :is="states.get(level.id) === 'locked' ? 'div' : NuxtLink"
            :to="
              states.get(level.id) === 'locked'
                ? undefined
                : `/play/${level.id}`
            "
            :aria-current="level.id === current.id ? 'page' : undefined"
            :aria-disabled="states.get(level.id) === 'locked' || undefined"
            class="flex min-h-control items-center gap-3 px-2 py-1.5 aria-[current=page]:bg-accent aria-disabled:opacity-50 [a&]:hover:bg-accent"
            @click="states.get(level.id) !== 'locked' && (open = false)"
          >
            <span
              class="flex h-9 w-12 shrink-0 items-center justify-center bg-muted p-1"
            >
              <LevelPreview :level="level" :frame-aspect="4 / 3" />
            </span>
            <span class="min-w-0 flex-1 truncate">{{ level.title }}</span>
            <span
              class="flex shrink-0 items-center gap-1 text-label text-muted-foreground"
            >
              <template v-if="best[level.id]">
                <CheckIcon class="size-4" />
                {{ best[level.id]?.moves }}
              </template>
              <template v-else-if="states.get(level.id) === 'current'">
                <PlayIcon class="size-4" />
                Up next
              </template>
              <LockIcon
                v-else-if="states.get(level.id) === 'locked'"
                class="size-4"
                aria-label="Locked"
              />
            </span>
          </component>
        </li>
      </ul>
    </SheetContent>
  </Sheet>
</template>
