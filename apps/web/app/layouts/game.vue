<!--
  The play page: the game fills the screen with its own top and bottom bars,
  so there's no site header or footer.
-->
<template>
  <div class="flex h-dvh flex-col overflow-hidden">
    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>
