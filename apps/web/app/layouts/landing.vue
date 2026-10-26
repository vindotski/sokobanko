<!-- Landing page: full width, with the made-by footer. -->
<template>
  <div class="flex min-h-svh flex-col">
    <AppHeader />
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
    <MadeByFooter />
  </div>
</template>
