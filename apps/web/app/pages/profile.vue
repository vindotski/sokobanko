<script setup lang="ts">
// Temporary: inspect the session's JWT claims while auth is being built.
const user = useSupabaseUser();
const { data: completions } = await useCompletions();
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
    <h1 class="text-2xl font-bold">Profile</h1>
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
  </div>
</template>
