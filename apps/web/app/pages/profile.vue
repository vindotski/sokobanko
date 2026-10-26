<script setup lang="ts">
import { UserIcon } from "@lucide/vue";

// The session's JWT claims. The raw claims card at the bottom is development
// only: Nuxt strips DevOnly blocks from production builds (don't write the tag
// in comments, as the stripping is a plain text match over this whole file).
const user = useSupabaseUser();
const { data: completions } = await useCompletions();
const { data: levelIds } = await useLevelIds();

const isGuest = computed(() => user.value?.is_anonymous !== false);
const name = computed(() =>
  isGuest.value ? "Guest" : String(user.value?.email ?? "Player"),
);

const stats = computed(() => {
  const done = completions.value ?? [];
  const total = levelIds.value?.length ?? 0;
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
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
    <div class="flex items-center gap-4">
      <Avatar class="size-12">
        <AvatarFallback><UserIcon /></AvatarFallback>
      </Avatar>
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="truncate text-2xl font-semibold tracking-tight">
          {{ name }}
        </h1>
        <p v-if="isGuest" class="text-sm text-muted-foreground">
          Clearing site data will lose all your progress. Accounts are coming
          soon.
        </p>
      </div>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Solved</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ stats.solved }} of {{ stats.total }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress :model-value="stats.percent" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Best moves</CardDescription>
          <CardTitle class="text-2xl tabular-nums">{{ stats.moves }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Best pushes</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ stats.pushes }}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
    <DevOnly>
      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
          <CardDescription>JWT claims from useSupabaseUser()</CardDescription>
        </CardHeader>
        <CardContent>
          <pre class="overflow-x-auto rounded-md bg-muted p-4 text-xs">{{
            user ? JSON.stringify(user, null, 2) : "No session yet"
          }}</pre>
        </CardContent>
      </Card>
    </DevOnly>
    <Card>
      <CardHeader>
        <CardTitle>Completed levels</CardTitle>
        <CardDescription>Your best verified result for each level.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table v-if="completions?.length">
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
              :key="completion.level.id"
            >
              <TableCell>
                <NuxtLink
                  :to="`/levels/${completion.level.id}`"
                  class="font-medium hover:underline"
                >
                  {{ completion.level.title }}
                </NuxtLink>
              </TableCell>
              <TableCell class="text-right tabular-nums">
                {{ completion.moves }}
              </TableCell>
              <TableCell class="text-right tabular-nums">
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
