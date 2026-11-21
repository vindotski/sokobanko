<script setup lang="ts">
import { UserIcon } from "@lucide/vue";

/**
 * Progress: how far the player has got, from the browser's collections
 * (useProgress), the guest's "playing since" from the server, and their data
 * to download or delete (the YourData block). Browser
 * only and not indexed (routeRules): it's personal.
 */
const { data: guest } = useAccount();
const { levels, completions } = useProgress();
const yourData = useYourData();

useSeoMeta({ title: "Progress · Sokobanko", robots: "noindex" });

const unsynced = computed(
  () => completions.value.filter((c) => !c.synced).length,
);
const stats = computed(() => {
  const done = completions.value;
  const total = levels.value.length;
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
  <PageHeader title="Progress" />
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
    <div class="flex items-center gap-4">
      <Avatar class="size-12">
        <AvatarFallback><UserIcon /></AvatarFallback>
      </Avatar>
      <div class="flex min-w-0 flex-col gap-1">
        <h2 class="truncate text-lead font-semibold">Guest</h2>
        <p v-if="guest" class="text-small text-muted-foreground">
          Playing since
          <NuxtTime :datetime="guest.since" date-style="medium" />. Kept in this
          browser; accounts are coming soon.
        </p>
        <p v-else class="text-small text-muted-foreground">
          Solve a level and your progress is kept in this browser. Accounts are
          coming soon.
        </p>
      </div>
    </div>

    <!-- 2×2 on phones, 4 across from md. -->
    <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="col-span-2 flex flex-col gap-2 border p-4 md:col-span-1">
        <dt class="text-label text-muted-foreground">Solved</dt>
        <dd class="font-mono text-title">{{ stats.solved }} of {{ stats.total }}</dd>
        <dd><Progress :model-value="stats.percent" aria-label="Levels solved" /></dd>
      </div>
      <div class="flex flex-col gap-2 border p-4">
        <dt class="text-label text-muted-foreground">Best moves</dt>
        <dd class="font-mono text-title">{{ stats.moves }}</dd>
      </div>
      <div class="flex flex-col gap-2 border p-4">
        <dt class="text-label text-muted-foreground">Best pushes</dt>
        <dd class="font-mono text-title">{{ stats.pushes }}</dd>
      </div>
      <div class="col-span-2 flex flex-col gap-2 border p-4 md:col-span-1">
        <dt class="text-label text-muted-foreground">Saved</dt>
        <dd class="text-body">
          {{ unsynced ? `${unsynced} waiting to sync` : "All verified" }}
        </dd>
      </div>
    </dl>

    <section aria-labelledby="completed-title" class="flex flex-col gap-3">
      <h2 id="completed-title" class="text-lead font-semibold">Completed levels</h2>
      <template v-if="completions.length">
        <!-- A list on phones… -->
        <ul class="flex flex-col divide-y border md:hidden">
          <li v-for="completion in completions" :key="completion.levelId">
            <NuxtLink
              :to="`/levels/${completion.levelId}`"
              class="flex min-h-control items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
            >
              <span class="flex min-w-0 flex-col">
                <span class="truncate font-medium">{{ completion.title }}</span>
                <span class="text-small text-muted-foreground">
                  <NuxtTime :datetime="completion.completedAt" date-style="medium" />
                </span>
              </span>
              <span class="flex shrink-0 flex-col items-end font-mono text-small">
                <span>{{ completion.moves }} moves</span>
                <span class="text-muted-foreground">{{ completion.pushes }} pushes</span>
                <Badge v-if="!completion.synced" variant="outline" class="mt-1 font-sans">
                  Not synced yet
                </Badge>
              </span>
            </NuxtLink>
          </li>
        </ul>
        <!-- …a table from md. -->
        <Table class="max-md:hidden">
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead class="text-right">Moves</TableHead>
              <TableHead class="text-right">Pushes</TableHead>
              <TableHead class="text-right">Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="completion in completions" :key="completion.levelId">
              <TableCell>
                <NuxtLink
                  :to="`/levels/${completion.levelId}`"
                  class="font-medium hover:underline"
                >
                  {{ completion.title }}
                </NuxtLink>
                <Badge v-if="!completion.synced" variant="outline" class="ml-2">
                  Not synced yet
                </Badge>
              </TableCell>
              <TableCell class="text-right font-mono">{{ completion.moves }}</TableCell>
              <TableCell class="text-right font-mono">{{ completion.pushes }}</TableCell>
              <TableCell class="text-right text-muted-foreground">
                <NuxtTime
                  :datetime="completion.completedAt"
                  date-style="medium"
                  time-style="short"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <Empty v-else class="border">
        <EmptyHeader>
          <EmptyTitle>No levels solved yet</EmptyTitle>
          <EmptyDescription>
            Solve a level and your best result shows up here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button as-child>
            <NuxtLink to="/">Go to the map</NuxtLink>
          </Button>
        </EmptyContent>
      </Empty>
    </section>

    <YourData
      app-name="Sokobanko"
      :export-app="yourData.exportApp"
      @deleted="yourData.forget"
    >
      <AnalyticsSwitch />
      <p class="text-small text-muted-foreground">
        What's kept, and why: the
        <NuxtLink to="/privacy" class="underline underline-offset-4">privacy policy</NuxtLink>.
      </p>
    </YourData>
  </div>
</template>
