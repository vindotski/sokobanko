<template>
  <div class="flex flex-col items-center gap-6 py-16 text-center">
    <h1 class="text-4xl font-bold">Sokobanko</h1>
    <p class="text-muted-foreground">Push every box onto a goal.</p>
    <Button as-child size="lg">
      <NuxtLink to="/levels">Play</NuxtLink>
    </Button>
  </div>
</template>
