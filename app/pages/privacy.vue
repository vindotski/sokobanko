<script setup lang="ts">
import {
  type AppData,
  type Doc,
  list,
  paragraph,
  privacyPolicy,
} from "@kodentuzo/spotstrap/blocks";

/**
 * The privacy policy, from the instance's legal facts (who runs Sokobanko and
 * what the server does) and what Sokobanko itself keeps, below. Server-rendered
 * and indexed. Keep the lists true to the code: they're every cookie and
 * storage key the app writes.
 */
usePageSeo({
  title: "Privacy Policy · Sokobanko",
  description:
    "What Sokobanko keeps about you, why, where and for how long, and how to download or delete it.",
  path: "/privacy",
});
const { facts, error, updated } = useLegalFacts();

/** What Sokobanko keeps on its server, beyond the platform's processing. */
const appData: AppData[] = [
  {
    what: "Your result for each level you solve: your best number of moves and pushes, and when",
    why: "so your progress is yours, on any device, and every score is fair",
    kept: "until you delete your data",
  },
  {
    what: "The moves of each solve",
    why: "to check that it really solves the level",
    kept: "not kept: they're discarded once checked",
  },
  {
    what: "Error logs, without your IP address",
    why: "to find and fix problems",
    kept: "overwritten within days",
  },
];

/** What this browser keeps for Sokobanko (composables/yourData.ts clears it). */
const browser = [
  [
    "sokobanko-map (cookie)",
    "the level up next in each collection, so the map loads as you left it",
    "a year",
  ],
  [
    "sokobanko-map-columns (cookie)",
    "how many levels fit in a row of your map",
    "a year",
  ],
  [
    "sokobanko:runs:v2",
    "the levels you've solved here, with your best moves, so they count even offline",
    "until you delete your data",
  ],
  [
    "sokobanko:run:<level>",
    "a level you're in the middle of, so a reload picks it up",
    "until you finish or delete your data",
  ],
  ["sokobanko:sound", "whether sound is on", "until you change it"],
  [
    "nuxt-color-mode",
    "light, dark or the system's theme",
    "until you change it",
  ],
  [
    "offline-transactions (IndexedDB)",
    "solves waiting to be sent when the server can't be reached",
    "until they're sent",
  ],
];

const doc = computed<Doc | undefined>(() => {
  if (!facts.value) return undefined;
  const policy = privacyPolicy(facts.value, { appName: "Sokobanko", appData });
  const own = policy.sections.findIndex((s) => s.id === "app");
  policy.sections.splice(own + 1, 0, {
    id: "browser",
    heading: "What this browser keeps",
    blocks: [
      paragraph(
        "All of it is needed for the game to work, or for something you chose, like a theme. Nothing tracks you.",
      ),
      list(
        browser.map(([name, why, kept]) => [
          `${name}: ${why}. How long: ${kept}.`,
        ]),
      ),
    ],
  });
  policy.sections.push({
    id: "children",
    heading: "Children",
    blocks: [
      paragraph(
        "Sokobanko is for all ages and asks for nothing that identifies anyone: no name, email or birthday. A parent can delete a child's data under Progress → Your data, or ask by email.",
      ),
    ],
  });
  return {
    ...policy,
    title: "",
    intro: [
      "Sokobanko is a free puzzle game with no ads. This page says what it keeps about you, why, for how long, and what you can do about it.",
    ],
    footer: undefined,
  };
});
</script>

<template>
  <PageHeader title="Privacy Policy" :subtitle="updated ? `Last updated ${updated}` : undefined" />
  <div class="mx-auto w-full max-w-3xl px-4 py-6">
    <LegalDocument v-if="doc" :doc="doc" />
    <p v-else-if="error" role="alert">
      The privacy policy can't be shown right now. Email the address in the
      legal notice for it.
    </p>
  </div>
  <LegalLinks class="mx-auto w-full max-w-3xl px-4 pb-8" />
</template>
