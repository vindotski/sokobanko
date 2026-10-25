<template>
  <div class="flex min-h-svh flex-col">
    <header class="border-b">
      <nav class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <NuxtLink to="/" class="font-bold">Sokobanko</NuxtLink>
        <div class="ml-auto flex gap-4 text-sm">
          <NuxtLink
            to="/levels"
            class="text-muted-foreground hover:text-foreground [&.router-link-active]:text-foreground"
          >
            Levels
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="text-muted-foreground hover:text-foreground [&.router-link-active]:text-foreground"
          >
            Profile
          </NuxtLink>
          <NuxtLink
            to="/faq"
            class="text-muted-foreground hover:text-foreground [&.router-link-active]:text-foreground"
          >
            FAQ
          </NuxtLink>
        </div>
      </nav>
    </header>
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>
