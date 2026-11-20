<script setup lang="ts">
usePageSeo({
  title: "Privacy",
  description:
    "What Sokobanko stores, what its host counts, and how to get your data deleted.",
});

const email = "ivan@vin.ski";
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-title">Privacy</h1>
      <p class="text-sm text-muted-foreground">
        What Sokobanko keeps about you, and how to have it removed.
      </p>
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">What the game stores</h2>
      <ul class="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
        <li>
          <span class="text-foreground">A guest cookie.</span> Your first
          solved level or daily puzzle makes you a guest, with a session cookie from Spotcraft's
          kit. It holds no name or email, only a random guest id, and it's
          first-party: no other site can read it.
        </li>
        <li>
          <span class="text-foreground">Your best result per level.</span> The
          moves and pushes of your best solution to each level, and when you
          solved it, saved on our server under your guest.
        </li>
        <li>
          <span class="text-foreground">Your daily puzzle results.</span> For
          each day you solve the daily puzzle, your best moves and pushes, and
          when. They make your streak.
        </li>
        <li>
          <span class="text-foreground">In your browser's localStorage:</span>
          a level you've left half-played, so you can pick it up again, and your
          sound and light or dark theme settings. These never leave your
          browser.
        </li>
      </ul>
      <p class="text-muted-foreground">
        There are no accounts, ads or third-party trackers.
      </p>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">What Spotcraft counts</h2>
      <p class="text-muted-foreground">
        Sokobanko runs on Spotcraft, our own hosting platform, on our own
        servers. Spotcraft counts visits with Umami: which pages are viewed and
        events such as solving a level. It sets no cookie and sends no id, so a
        visit can't be tied to you. Spotcraft's
        <a
          href="/_spotcraft/privacy"
          class="font-medium text-foreground underline"
          >privacy page</a
        >
        lists what it collects and lets you opt out of being counted.
      </p>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">Deleting your data</h2>
      <p class="text-muted-foreground">
        Clearing this site's data in your browser's settings removes what's in
        your browser, including the guest cookie, but leaves your results on
        the server, no longer tied to anyone you can reach. To have them
        deleted too, email
        <a
          :href="`mailto:${email}?subject=Delete my Sokobanko data`"
          class="font-medium text-foreground underline"
          >{{ email }}</a
        >
        before you clear anything. A guest has no name or email, so tell us
        when you started playing and a few levels you solved, both on your
        <NuxtLink to="/profile" class="font-medium text-foreground underline"
          >profile</NuxtLink
        >, and we'll find your guest and delete it with its results.
      </p>
    </section>
  </div>
</template>
