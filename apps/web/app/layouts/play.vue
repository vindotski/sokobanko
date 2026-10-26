<!-- Play pages: full width and height for the game, no padding or footer. -->
<template>
  <div class="flex min-h-svh flex-col">
    <AppHeader />
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>
