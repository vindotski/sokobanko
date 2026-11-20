<script setup lang="ts">
import { UNDO_BUDGET } from "@sokobanko/core";

/**
 * Help: how to play, the controls, the FAQ and about. Server-rendered and
 * indexed. Settings links to #controls and #about.
 */
usePageSeo({
  title: "How to play · Sokobanko",
  description:
    "How to play Sokoban: push every box onto a goal, never pull. Controls for touch and keyboard, answers to common questions, and where the levels come from.",
  path: "/help",
});

const questions = [
  {
    question: "How do I play?",
    answer:
      "Push every box onto a goal. You can only push, never pull, and only one box at a time, so plan before you move.",
  },
  {
    question: "What are the controls?",
    answer:
      "Drag anywhere on the board to move, or use the arrow keys or WASD on a keyboard. Undo takes back your last move, three times per attempt, and Restart starts the level over with all three back. The full list is under Controls, below.",
  },
  {
    question: "What's the difference between moves and pushes?",
    answer:
      "Every step counts as a move. A push is a move that also pushes a box. Your best result for each level is the solution with the fewest moves.",
  },
  {
    question: "How do I see a whole big level?",
    answer:
      "Pinch, or use the + and − buttons on the board's corner, to zoom; the whole-level button (or holding Space on a keyboard) shows everything at once. Drag with two fingers, or scroll, to look around.",
  },
  {
    question: "Is my progress saved?",
    answer:
      "Yes. A solve counts at once in this browser, even offline, and is checked and saved by the server whenever it can be reached; your first one makes you a guest. Signing up to keep it across devices is coming soon.",
  },
  {
    question: "Where do the levels come from?",
    answer:
      "The first four were made for Sokobanko, except Hello World!, from DoctorLai's sokoban-web. The rest are David W. Skinner's Microban, 155 small puzzles that each show an idea, shared freely as long as he's credited.",
  },
  {
    question: "Can I make my own levels?",
    answer: "Not yet, but it's planned.",
  },
  {
    question: "Which technologies were used to make this?",
    answer:
      "TypeScript throughout: Nuxt and Vue for the site, PixiJS for drawing the game, Tailwind CSS and shadcn-vue for the interface, Postgres for the levels and saved results, and Spotcraft to host it on our own servers, with its kit for guest sessions.",
  },
  {
    question: "I didn't find my answer here. What do I do?",
    answer:
      "Questions, bug reports and ideas are all welcome. Send an email to",
    email: "ivan@vin.ski",
  },
];
</script>

<template>
  <PageHeader title="Help" />
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-6">
    <section aria-labelledby="how-title" class="flex flex-col gap-3">
      <h2 id="how-title" class="text-title">How to play</h2>
      <p class="text-body">
        Push every box onto a goal. You can only push, never pull, and only one
        box at a time, so think before you move. A box in a corner, or against
        a wall with no goal along it, can never move again: the board crosses
        it out.
      </p>
      <p class="text-body text-muted-foreground">
        Each attempt has {{ UNDO_BUDGET }} undos; Restart gives them back. Your
        best is the solution with the fewest moves, then the fewest pushes.
      </p>
    </section>

    <section id="controls" aria-labelledby="controls-title" class="flex scroll-mt-20 flex-col gap-3">
      <h2 id="controls-title" class="text-title">Controls</h2>
      <ControlsTable />
    </section>

    <section aria-labelledby="faq-title" class="flex flex-col gap-3">
      <h2 id="faq-title" class="text-title">Questions</h2>
      <Accordion type="single" collapsible>
        <AccordionItem
          v-for="(item, index) in questions"
          :key="index"
          :value="`item-${index}`"
        >
          <AccordionTrigger>{{ item.question }}</AccordionTrigger>
          <AccordionContent>
            {{ item.answer }}
            <a
              v-if="item.email"
              :href="`mailto:${item.email}`"
              class="font-medium underline underline-offset-4"
            >
              {{ item.email }}</a
            ><template v-if="item.email">.</template>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>

    <section id="about" aria-labelledby="about-title" class="flex scroll-mt-20 flex-col gap-3">
      <h2 id="about-title" class="text-title">About</h2>
      <div class="flex items-center gap-3">
        <Avatar class="size-10">
          <AvatarImage src="/vinski.jpg" alt="" class="grayscale" />
          <AvatarFallback>VF</AvatarFallback>
        </Avatar>
        <p class="text-body">
          Made by
          <a
            href="https://www.vin.ski"
            title="Ivan Vinski"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-4"
          >
            Vinski&amp;Friends
          </a>
          in Croatia.
        </p>
      </div>
      <p class="text-small text-muted-foreground">
        The code is open source under the AGPL-3.0-only licence, on
        <a
          href="https://github.com/vindotski/sokobanko"
          class="underline underline-offset-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub</a
        >. Hello World! is from DoctorLai's sokoban-web (MIT). The Microban
        levels are by David W. Skinner, shared freely with credit.
      </p>
    </section>
  </div>
</template>
