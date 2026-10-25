<script setup lang="ts">
// Temporary: inspect the session's JWT claims while auth is being built.
const user = useSupabaseUser();
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
    <h1 class="text-2xl font-bold">Profile</h1>
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
