<script setup lang="ts">
import { UserIcon } from "@lucide/vue";

const { data: guest } = await useAccount();
const { data: completed } = await useCompletions();
const { data: levels } = await useLevels();

// Bests with their level's title. A level that has since been removed is
// left out.
const completions = computed(() => {
  const titles = new Map((levels.value ?? []).map((l) => [l.id, l.title]));
  return (completed.value ?? []).flatMap((c) => {
    const title = titles.get(c.level_id);
    return title ? [{ ...c, title }] : [];
  });
});

const stats = computed(() => {
  const done = completions.value;
  const total = levels.value?.length ?? 0;
  return {
    solved: done.length,
    total,
    percent: total ? (done.length / total) * 100 : 0,
    moves: done.reduce((sum, c) => sum + c.moves, 0),
    pushes: done.reduce((sum, c) => sum + c.pushes, 0),
  };
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <Avatar class="size-12">
        <AvatarFallback><UserIcon /></AvatarFallback>
      </Avatar>
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="truncate text-title">Guest</h1>
        <p v-if="guest" class="text-sm text-muted-foreground">
          Playing since
          <NuxtTime :datetime="guest.since" date-style="medium" />. Clearing
          site data will lose all your progress. Accounts are coming soon.
        </p>
        <p v-else class="text-sm text-muted-foreground">
          Nothing saved yet: solve a level and your progress is kept in this
          browser. Accounts are coming soon.
        </p>
      </div>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription class="text-label">Solved</CardDescription>
          <CardTitle class="font-mono text-title">
            {{ stats.solved }} of {{ stats.total }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress :model-value="stats.percent" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription class="text-label">Best moves</CardDescription>
          <CardTitle class="font-mono text-title">{{ stats.moves }}</CardTitle>
        </CardHeader>
        <!-- Same height as the Solved card's progress bar, so the rows line up. -->
        <CardContent class="flex h-2 items-center">
          <p class="text-label text-muted-foreground">Server-verified</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription class="text-label">Best pushes</CardDescription>
          <CardTitle class="font-mono text-title">
            {{ stats.pushes }}
          </CardTitle>
        </CardHeader>
        <CardContent class="flex h-2 items-center">
          <p class="text-label text-muted-foreground">Server-verified</p>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Completed levels</CardTitle>
        <CardDescription>Your best verified result for each level.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table v-if="completions.length">
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead class="text-right">Moves</TableHead>
              <TableHead class="text-right">Pushes</TableHead>
              <TableHead class="text-right">Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="completion in completions"
              :key="completion.level_id"
            >
              <TableCell>
                <NuxtLink
                  :to="`/play/${completion.level_id}`"
                  class="font-medium hover:underline"
                >
                  {{ completion.title }}
                </NuxtLink>
              </TableCell>
              <TableCell class="text-right font-mono">
                {{ completion.moves }}
              </TableCell>
              <TableCell class="text-right font-mono">
                {{ completion.pushes }}
              </TableCell>
              <TableCell class="text-right text-muted-foreground">
                <NuxtTime
                  :datetime="completion.completed_at"
                  date-style="medium"
                  time-style="short"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Empty v-else>
          <EmptyHeader>
            <EmptyTitle>No levels solved yet</EmptyTitle>
            <EmptyDescription>
              Solve a level and your best result shows up here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button as-child>
              <NuxtLink to="/levels">Browse levels</NuxtLink>
            </Button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  </div>
</template>
