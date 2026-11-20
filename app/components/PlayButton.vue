<script setup lang="ts">
import { PlayIcon, ShuffleIcon, WandSparklesIcon } from "@lucide/vue";

// One "play" call to action that adapts to the player's progress:
// nothing solved yet → "Let's play", some → "Continue", all → "Random level".
// /play already opens the next unsolved level. Attributes such as `size` pass
// through to the Button. Browser only: progress lives there (<ClientOnly>).
const { levels, best } = useProgress();
const levelIds = computed(() => levels.value.map((level) => level.id));

const state = computed(() => {
  const ids = levelIds.value;
  const solved = ids.filter((id) => id in best.value).length;
  if (solved === 0) return "start";
  return solved < ids.length ? "continue" : "random";
});

function playRandom() {
  const ids = levelIds.value;
  const id = ids[Math.floor(Math.random() * ids.length)];
  if (id) navigateTo(`/play/${id}`);
}
</script>

<template>
  <Button v-if="state === 'random'" @click="playRandom">
    <ShuffleIcon data-icon="inline-start" />
    Random level
  </Button>
  <Button v-else-if="levelIds?.length" as-child>
    <NuxtLink to="/play">
      <WandSparklesIcon v-if="state === 'start'" data-icon="inline-start" />
      <PlayIcon v-else data-icon="inline-start" />
      {{ state === "start" ? "Let's play" : "Continue" }}
    </NuxtLink>
  </Button>
  <!-- No levels published yet. -->
  <Button v-else disabled>
    <WandSparklesIcon data-icon="inline-start" />
    Let's play
  </Button>
</template>
