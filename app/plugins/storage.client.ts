import {
  forgetThemeUntilStoring,
  restoreStorage,
  startStoring,
  storing,
} from "~/composables/storage";

/**
 * The storage switch (composables/storage.ts): off until the player's first
 * click on a level. A later visit turns it on if the pool knows the browser's
 * session, which creates nothing. Storybook renders components without the
 * app's server.
 *
 * The theme module (@nuxtjs/color-mode) writes the theme to localStorage as
 * soon as it loads, so while storage is off its key is removed again, and the
 * choice lasts for the visit only; turning storage on writes it.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.env.STORYBOOK) return;
  nuxtApp.hook("app:mounted", forgetThemeUntilStoring);
  watch(() => nuxtApp.$colorMode.preference, forgetThemeUntilStoring, {
    flush: "post",
  });
  const run = (task: () => Promise<void>) =>
    nuxtApp
      .runWithContext(task)
      .catch((error) => console.error("Could not set up storage:", error));
  // Capture phase, so it runs before the click's own navigation.
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('a[href^="/play"]') &&
        !storing()
      ) {
        void run(startStoring);
      }
    },
    { capture: true },
  );
  void run(restoreStorage);
});
