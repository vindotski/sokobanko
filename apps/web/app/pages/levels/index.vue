<script setup lang="ts">
const progress = useProgressStore();
const { data: levels } = await useLevels();
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
    <h1 class="text-2xl font-bold">Levels</h1>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="(level, index) in levels"
        :key="level.id"
        :to="`/levels/${level.id}`"
      >
        <Card class="h-full transition-colors hover:bg-accent">
          <CardHeader>
            <CardTitle>{{ level.title }}</CardTitle>
            <CardDescription>
              {{ progress.isCompleted(level.id) ? "Completed" : `Level ${index + 1}` }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LevelPreview :level="level" />
          </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
