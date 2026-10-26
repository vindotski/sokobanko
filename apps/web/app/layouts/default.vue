<!-- Content pages (levels, profile, FAQ): a narrow centred column. -->
<template>
  <div class="flex min-h-svh flex-col">
    <AppHeader />
    <main class="flex flex-1 flex-col">
      <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
