<script setup lang="ts">
import {
  ArrowRightIcon,
  LockIcon,
  MapIcon,
  RotateCcwIcon,
  TrophyIcon,
} from "@lucide/vue";

/**
 * The level-complete screen: this run against your best, whether it's saved,
 * and one big Next. A sheet from the bottom on phones, a dialog elsewhere
 * (the dialog docks itself; components/ui/dialog).
 */
defineProps<{
  title: string;
  levelId: string;
  run: { moves: number; pushes: number };
  best?: { moves: number; pushes: number };
  isNewBest: boolean;
  saveState: "saved" | "saving" | "local" | "rejected";
  /** The next level in play order; none after the last. */
  next?: { id: string; title: string };
  nextLocked: boolean;
}>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ replay: [] }>();

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="items-center text-center">
        <TrophyIcon class="size-10" aria-hidden="true" />
        <DialogTitle class="text-title">Level complete</DialogTitle>
        <DialogDescription>
          {{ title }}
          <Badge v-if="isNewBest" class="ml-1">New best!</Badge>
        </DialogDescription>
      </DialogHeader>

      <dl class="grid grid-cols-2 gap-3 font-mono">
        <div class="flex flex-col gap-1 border p-4">
          <dt class="font-sans text-label text-muted-foreground">This run</dt>
          <dd class="text-title">{{ count(run.moves, "move", "moves") }}</dd>
          <dd class="text-small text-muted-foreground">
            {{ count(run.pushes, "push", "pushes") }}
          </dd>
        </div>
        <div class="flex flex-col gap-1 border p-4">
          <dt class="font-sans text-label text-muted-foreground">Your best</dt>
          <template v-if="best">
            <dd class="text-title">{{ count(best.moves, "move", "moves") }}</dd>
            <dd class="text-small text-muted-foreground">
              {{ count(best.pushes, "push", "pushes") }}
            </dd>
          </template>
        </div>
      </dl>
      <p
        class="min-h-6 text-center text-small"
        :class="saveState === 'rejected' ? 'text-destructive' : 'text-muted-foreground'"
        aria-live="polite"
      >
        <template v-if="saveState === 'rejected'">The server couldn't verify this run</template>
        <template v-else-if="saveState === 'saving'">Saving…</template>
        <template v-else-if="saveState === 'local'">
          Saved on this device; it'll sync when the server is back
        </template>
        <template v-else>Saved</template>
      </p>

      <div class="flex flex-col gap-2">
        <!-- Solving unlocks the next level at once; it stays locked only if
             the server refused this run. -->
        <Button v-if="nextLocked" size="lg" disabled>
          Next level
          <LockIcon data-icon="inline-end" />
        </Button>
        <Button v-else-if="next" size="lg" as-child>
          <NuxtLink :to="`/play/${next.id}`">
            Next level
            <ArrowRightIcon data-icon="inline-end" />
          </NuxtLink>
        </Button>
        <Button v-else size="lg" as-child>
          <NuxtLink to="/play">
            <TrophyIcon data-icon="inline-start" />
            Finish
          </NuxtLink>
        </Button>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" @click="emit('replay')">
            <RotateCcwIcon data-icon="inline-start" />
            Replay
          </Button>
          <Button variant="outline" as-child>
            <NuxtLink :to="`/levels/${levelId}`">
              <MapIcon data-icon="inline-start" />
              Map
            </NuxtLink>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
