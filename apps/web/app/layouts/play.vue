<!-- Play pages: site header, then the game fills the rest. No footer. -->
<template>
  <div class="flex min-h-svh flex-col">
    <SiteHeader />
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>
