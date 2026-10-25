<script setup lang="ts">
import { LEVELS } from "~/data/levels";

const progress = useProgressStore();
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
    <h1 class="text-2xl font-bold">Profile</h1>
    <Card class="max-w-md">
      <CardHeader>
        <CardTitle>Guest</CardTitle>
        <CardDescription>Sign in coming soon.</CardDescription>
      </CardHeader>
      <CardContent>
        Completed {{ progress.completed.length }} of {{ LEVELS.length }} levels
      </CardContent>
    </Card>
  </div>
</template>
