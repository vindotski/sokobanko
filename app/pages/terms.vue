<script setup lang="ts">
/** The terms of use. Server-rendered and indexed. */
usePageSeo({
  title: "Terms of Use · Sokobanko",
  description:
    "The terms for playing Sokobanko: free to play, play fair, and no guarantees beyond what the law requires.",
  path: "/terms",
});
const { facts } = useLegalFacts();
const owner = computed(() => facts.value?.controller);
</script>

<template>
  <LegalArticle title="Terms of Use">
    <p>
      Sokobanko is a free Sokoban game, run by {{ owner?.name ?? "its owner" }} (the
      <NuxtLink to="/legal">legal notice</NuxtLink> has the details). By playing
      it, you agree to these terms. They're short on purpose.
    </p>

    <h2>Playing</h2>
    <ul>
      <li>Sokobanko is free. There are no payments, ads or purchases.</li>
      <li>
        You don't need an account. Your first solve makes you a guest, so the
        server can keep your results; the
        <NuxtLink to="/privacy">privacy policy</NuxtLink> says what that means.
      </li>
      <li>
        You can stop at any time, and delete your data from Progress → Your
        data.
      </li>
    </ul>

    <h2>Playing fair</h2>
    <p>Please don't:</p>
    <ul>
      <li>
        flood, attack or try to break into the site or the server, or get
        around its limits;
      </li>
      <li>
        play or save through automated scripts at a scale that burdens it;
      </li>
      <li>send forged results, or use the site to harm others.</li>
    </ul>
    <p>
      Results that break these terms may be removed, and access blocked.
    </p>

    <h2>The levels and the code</h2>
    <p>
      The levels belong to their authors and are used with credit, as their
      terms allow: Microban by David W. Skinner, and Hello World! from
      DoctorLai's sokoban-web (MIT). Sokobanko's code is open source under the
      <a
        href="https://github.com/vindotski/sokobanko/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
        >AGPL-3.0-only licence</a
      >.
    </p>

    <h2>No guarantees</h2>
    <p>
      Sokobanko is offered as it is. It may change, be unavailable for a time,
      or end, and while results are backed up, they can't be guaranteed to
      stay. Liability is limited as far as the law allows; nothing here limits
      liability for intent or gross negligence, for harm to life, body or
      health, or any other that the law doesn't let be limited.
    </p>

    <h2>Changes and law</h2>
    <p>
      These terms may change as Sokobanko does, for example when accounts
      arrive; the date at the top says when they last did. Croatian law
      applies, without taking away the protection the law
      of the country where you live gives you as a consumer.
    </p>
    <p>
      Questions:
      <a v-if="owner" :href="`mailto:${owner.email}`">{{ owner.email }}</a
      ><NuxtLink v-else to="/legal">see the legal notice</NuxtLink>.
    </p>
  </LegalArticle>
</template>
