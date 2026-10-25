<script setup lang="ts">
import { UserIcon } from "@lucide/vue";

// The session's JWT claims. The raw claims card at the bottom is development
// only: Nuxt strips DevOnly blocks from production builds (don't write the tag
// in comments, as the stripping is a plain text match over this whole file).
const user = useSupabaseUser();
const { data: completions } = await useCompletions();

const isGuest = computed(() => user.value?.is_anonymous !== false);
const name = computed(() =>
  isGuest.value ? "Guest" : String(user.value?.email ?? "Player"),
);
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
    <Card>
      <CardHeader>
        <CardTitle>Completed levels</CardTitle>
        <CardDescription>Your best verified result for each level.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
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
            <TableEmpty v-if="!completions?.length" :colspan="4">
              No completed levels yet.
            </TableEmpty>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
  </div>
</template>
