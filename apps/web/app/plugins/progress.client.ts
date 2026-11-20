/**
 * Reads this browser's progress once the app has hydrated (the server only
 * knows verified results, so the first render matches it), then uploads what
 * the server doesn't have yet: now, when the browser comes back online, and
 * when the player returns to the tab.
 */
export default defineNuxtPlugin(() => {
  const store = useProgressStore();
  onNuxtReady(() => {
    store.restoreLocal();
    store.sync();
    window.addEventListener("online", () => store.sync());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") store.sync();
    });
  });
});
