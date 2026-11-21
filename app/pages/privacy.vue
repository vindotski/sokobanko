<script setup lang="ts">
/**
 * The privacy policy: what Sokobanko processes, why, where and for how long,
 * and how to use your rights. Server-rendered and indexed. Keep it true to
 * the code: the cookies and storage below are every one the app writes.
 */
usePageSeo({
  title: "Privacy Policy · Sokobanko",
  description:
    "What Sokobanko keeps about you, why, where and for how long: no ads, no tracking, only what's needed to play and save your progress.",
  path: "/privacy",
});
const legal = useLegal();

const cookies = [
  {
    name: "better-auth.session_token",
    note: "with the prefix __Secure- on https",
    purpose:
      "Your guest session, set at your first save, so your results stay yours. Not readable by scripts.",
    lasts: "a year after it was last used",
  },
  {
    name: "sokobanko-map",
    purpose:
      "The level up next in each collection, so the map loads as you left it. Only once you've solved a level.",
    lasts: "a year",
  },
  {
    name: "sokobanko-map-columns",
    purpose: "How many levels fit in a row of your map, for the same reason.",
    lasts: "a year",
  },
];
const storage = [
  {
    name: "sokobanko:runs:v2",
    purpose:
      "The levels you've solved here, with your best moves, so they count even offline.",
  },
  {
    name: "sokobanko:run:<level>",
    purpose: "A level you're in the middle of, so a reload picks it up.",
  },
  { name: "sokobanko:sound", purpose: "Whether sound is on." },
  { name: "nuxt-color-mode", purpose: "Light, dark or the system's theme." },
  {
    name: "offline-transactions",
    note: "IndexedDB",
    purpose:
      "Solves waiting to be sent to the server, when it can't be reached.",
  },
];
</script>

<template>
  <LegalArticle title="Privacy Policy">
    <p>
      Sokobanko is a free puzzle game. It has no ads, no tracking and no
      analytics, loads nothing from other sites, and keeps only what it needs
      to let you play and save your progress. This page says what that is.
    </p>

    <h2>Who's responsible</h2>
    <p>
      {{ legal.name }}<template v-for="line in legal.address" :key="line"
        >, {{ line }}</template
      >, {{ legal.country }}. Email
      <a :href="`mailto:${legal.email}`">{{ legal.email }}</a> about anything on
      this page. Details are in the <NuxtLink to="/legal">legal notice</NuxtLink>.
    </p>

    <h2>What is processed, and why</h2>
    <h3>When you visit</h3>
    <p>
      Your browser sends your IP address and details such as its make and
      language with every request. Cloudflare and the server use them to
      deliver the pages and to protect them from abuse. No access logs are
      kept. Errors are logged without them, and those logs are overwritten
      within days.
    </p>
    <h3>When you play</h3>
    <p>
      Your progress is kept in your browser (below), so levels unlock even
      offline. Nothing is sent until you solve a level.
    </p>
    <h3>When you solve a level</h3>
    <ul>
      <li>
        <strong>A guest.</strong> Your first solve makes you a guest: a random
        id and when it was made. No name, email or password.
      </li>
      <li>
        <strong>Its session.</strong> A cookie keeps you signed in as that
        guest. With the session, the server stores the IP address and browser
        it was started from, to protect accounts. A limit on how many guests one
        address can make is counted in memory only.
      </li>
      <li>
        <strong>Your results.</strong> For each level: your best number of
        moves and pushes, and when. The moves themselves are checked, to verify
        the solve, and then discarded.
      </li>
    </ul>
    <p>
      Saving your results is the service you ask for when you play (Art.
      6(1)(b) GDPR). Protecting the service, limiting abuse and keeping backups
      are in its legitimate interest, and yours (Art. 6(1)(f) GDPR).
    </p>

    <h2 id="cookies" class="scroll-mt-20">Cookies and storage</h2>
    <p>
      Everything Sokobanko stores in your browser is needed for the game to
      work, or for something you asked for, like a theme. That's why there's no
      consent banner (Art. 5(3) ePrivacy Directive). Nothing is used to track
      you or shared with anyone.
    </p>
    <StorageList :items="cookies" />
    <p>
      The browser's own storage, which stays until you clear it, or use
      <strong>Delete my data</strong>:
    </p>
    <StorageList :items="storage" />

    <h2>Where it is, and who else handles it</h2>
    <p>
      Sokobanko runs on Spotcraft, self-hosted software, on one server. Two
      companies process data for it, under data processing agreements:
    </p>
    <ul>
      <li>
        <strong>Hetzner Online GmbH</strong> (Germany) hosts the server, in
        Falkenstein, Germany, and keeps its daily backups.
      </li>
      <li>
        <strong>Cloudflare, Inc.</strong> (USA) passes the traffic on to the
        server, protects it from attacks, and stores the app's backups. Data
        may reach the USA, under the EU–US Data Privacy Framework and the EU's
        standard contractual clauses.
      </li>
    </ul>
    <p>Nothing is sold or shared with anyone else.</p>

    <h2>How long it's kept</h2>
    <ul>
      <li><strong>Your results:</strong> until you delete them.</li>
      <li>
        <strong>Sessions</strong>, with their IP address and browser: until
        they expire, a year after they were last used.
      </li>
      <li>
        <strong>Your guest:</strong> until it's deleted. Ask by email (below);
        deleting it also deletes any results.
      </li>
      <li>
        <strong>Backups:</strong> up to 7 days for the server's, and up to 30
        days for the app's, which can't be changed. Data you delete leaves them
        within 30 days.
      </li>
      <li><strong>Error logs:</strong> overwritten within days.</li>
    </ul>

    <h2>Your rights</h2>
    <p>
      You have the right to see the data about you, to have it corrected or
      deleted, to restrict or object to its processing, and to get it in a
      file you can take elsewhere (Art. 15–21 GDPR).
    </p>
    <ul>
      <li>
        <strong>In the game:</strong> Progress → Your data downloads everything
        about you, or deletes your results, signs you out and clears this
        browser.
      </li>
      <li>
        <strong>By email:</strong> write to
        <a :href="`mailto:${legal.email}`">{{ legal.email }}</a>, for anything
        else, including deleting your guest. You'll get an answer within a
        month.
      </li>
    </ul>
    <p>
      You can also complain to a data protection authority, in particular in
      the EU country where you live or work.
      <template v-if="legal.country === 'Croatia'">
        Sokobanko's is Croatia's
        <a href="https://azop.hr" target="_blank" rel="noopener noreferrer"
          >AZOP</a
        >.
      </template>
      The European Data Protection Board lists
      <a
        href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en"
        target="_blank"
        rel="noopener noreferrer"
        >every authority</a
      >.
    </p>

    <h2>Children</h2>
    <p>
      Sokobanko is for all ages and asks for nothing that identifies anyone: no
      name, email or birthday. A parent can ask for a child's data to be
      deleted by email.
    </p>

    <h2>Changes</h2>
    <p>
      This page changes when Sokobanko does, for example when accounts with an
      email arrive. The date at the top says when it last did.
    </p>
  </LegalArticle>
</template>
