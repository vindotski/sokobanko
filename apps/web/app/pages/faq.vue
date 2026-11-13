<script setup lang="ts">
// Placeholder answers; extend as features land.
const questions = [
  {
    question: "How do I play?",
    answer:
      "Push every box onto a goal. You can only push, never pull, and only one box at a time, so plan before you move.",
  },
  {
    question: "What are the controls?",
    answer:
      "Drag anywhere on the board to move, or use the arrow keys or WASD on a keyboard. Undo takes back your last move and Restart starts the level over.",
  },
  {
    question: "What's the difference between moves and pushes?",
    answer:
      "Every step counts as a move. A push is a move that also pushes a box. Your best result for each level is the solution with the fewest moves.",
  },
  {
    question: "How do I see a whole big level?",
    answer:
      "On levels bigger than your screen, use the Overview button in the toolbar, or hold Space on a keyboard, to zoom out and see everything.",
  },
  {
    question: "Is my progress saved?",
    answer:
      "Yes, in this browser. Your first solved level makes you a guest, and every solved level is checked and saved with your best result. Signing up to keep it across devices is coming soon.",
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
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-title">FAQ</h1>
      <p class="text-sm text-muted-foreground">
        Answers to common questions about Sokobanko.
      </p>
    </div>
    <Accordion type="single" collapsible>
      <AccordionItem
        v-for="(item, index) in questions"
        :key="item.question"
        :value="`item-${index}`"
      >
        <AccordionTrigger>{{ item.question }}</AccordionTrigger>
        <AccordionContent class="text-muted-foreground">
          {{ item.answer }}
          <template v-if="item.email">
            <a
              :href="`mailto:${item.email}`"
              class="font-medium text-foreground underline"
              >{{ item.email }}</a
            >.
          </template>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>
