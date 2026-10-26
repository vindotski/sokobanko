<script setup lang="ts">
import { UserIcon } from "@lucide/vue";

// The session's JWT claims.
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

// Hidden debug card with the raw claims: click the avatar 10 times in a row
// (each within a second of the last) to toggle it. Not saved anywhere.
const TAPS_TO_TOGGLE = 10;
const TAP_GAP_MS = 1000;
const showClaims = ref(false);
let taps = 0;
let lastTap = 0;

function onAvatarClick() {
  const now = Date.now();
  taps = now - lastTap <= TAP_GAP_MS ? taps + 1 : 1;
  lastTap = now;
  if (taps < TAPS_TO_TOGGLE) return;
  taps = 0;
  showClaims.value = !showClaims.value;
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <Avatar class="size-12 select-none" @click="onAvatarClick">
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
        <!-- Same height as the Solved card's progress bar, so the rows line up. -->
        <CardContent class="flex h-2 items-center">
          <p class="text-xs text-muted-foreground">Server-verified</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Best pushes</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ stats.pushes }}
          </CardTitle>
        </CardHeader>
        <CardContent class="flex h-2 items-center">
          <p class="text-xs text-muted-foreground">Server-verified</p>
        </CardContent>
      </Card>
    </div>
    <Card v-if="showClaims">
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
                  :to="`/play/${completion.level.id}`"
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
