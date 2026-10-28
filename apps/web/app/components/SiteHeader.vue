<script setup lang="ts">
import { MenuIcon, UserIcon } from "@lucide/vue";

const route = useRoute();
const user = useSupabaseUser();
const accountName = computed(() =>
  user.value?.is_anonymous === false
    ? String(user.value.email ?? "Player")
    : "Guest",
);

const links = [
  { to: "/play", label: "Play" },
  { to: "/levels", label: "Levels" },
  { to: "/faq", label: "FAQ" },
];

// Matches subpages too, e.g. Play on /play/<id>. Vue Router's active class
// doesn't, because those are sibling routes rather than nested ones.
const isActive = (to: string) =>
  route.path === to || route.path.startsWith(`${to}/`);

const linkClass =
  "text-sm text-muted-foreground hover:text-foreground hover:underline aria-[current=page]:font-medium aria-[current=page]:text-foreground";

// Mobile drawer; closes whenever the page changes, and on any link click
// (a link to the current page doesn't change it).
const menuOpen = ref(false);
watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  },
);
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background">
    <!--
      Three columns at every size. Phones: menu button, centred title and theme
      toggle, with the account in the drawer. From md: title on the left, main
      links centred, avatar and theme toggle on the right.
    -->
    <nav
      class="mx-auto grid h-14 max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4"
    >
      <Sheet v-model:open="menuOpen">
        <SheetTrigger as-child>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open menu"
            class="col-start-1 row-start-1 justify-self-start md:hidden"
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="w-64">
          <SheetHeader>
            <SheetTitle>
              <NuxtLink to="/" @click="menuOpen = false">Sokoban</NuxtLink>
            </SheetTitle>
          </SheetHeader>
          <div class="flex flex-col px-2">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              @click="menuOpen = false"
              :aria-current="isActive(link.to) ? 'page' : undefined"
              class="rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:font-medium"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
          <!-- The account lives here on phones; the header has no avatar. -->
          <SheetFooter class="border-t">
            <NuxtLink
              to="/profile"
              :aria-current="isActive('/profile') ? 'page' : undefined"
              class="flex items-center gap-3 rounded-md p-2 hover:bg-accent aria-[current=page]:bg-accent"
              @click="menuOpen = false"
            >
              <Avatar class="size-8">
                <AvatarFallback><UserIcon class="size-4" /></AvatarFallback>
              </Avatar>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-sm font-medium">{{ accountName }}</span>
                <span class="text-label text-muted-foreground">View profile</span>
              </div>
            </NuxtLink>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <NuxtLink
        to="/"
        class="col-start-2 row-start-1 justify-self-center font-semibold md:col-start-1 md:justify-self-start"
      >
        Sokoban
      </NuxtLink>

      <div class="col-start-2 row-start-1 hidden gap-4 md:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :aria-current="isActive(link.to) ? 'page' : undefined"
          :class="linkClass"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <!-- The theme toggle stays at the far right at every size. -->
      <div class="col-start-3 row-start-1 flex items-center gap-2 justify-self-end">
        <NuxtLink
          to="/profile"
          aria-label="Profile"
          :aria-current="isActive('/profile') ? 'page' : undefined"
          class="hidden md:block aria-[current=page]:ring-2 aria-[current=page]:ring-foreground"
        >
          <Avatar class="size-8">
            <AvatarFallback><UserIcon class="size-4" /></AvatarFallback>
          </Avatar>
        </NuxtLink>
        <ThemeToggle />
      </div>
    </nav>
  </header>
</template>
