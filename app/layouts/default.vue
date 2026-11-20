<!--
  The app: Play (the map), Progress and Help. On phones the sections are a
  tab bar at the bottom; from md a rail, and from lg a sidebar, down the left.
  Pages bring their own header (PageHeader). The game has its own layout.
-->
<template>
  <div class="min-h-dvh bg-background">
    <AppSidebar class="max-md:hidden" />
    <main
      class="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-20 lg:pl-64"
    >
      <slot />
    </main>
    <AppTabBar class="md:hidden" />
    <SettingsSheet />
    <LazyProgressSync />
  </div>
</template>
