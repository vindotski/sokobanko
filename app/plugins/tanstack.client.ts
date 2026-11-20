/**
 * Starts the local collections and the upload outbox (app/collections) once
 * the browser is idle, so runs left from an earlier visit go out even on a
 * page that doesn't show progress. Imported lazily: TanStack stays out of the
 * entry chunk, and the server-rendered pages don't wait for it.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Storybook renders components without the app's server.
  if (import.meta.env.STORYBOOK) return;
  const start = () =>
    import("~/collections")
      .then(({ localData }) => nuxtApp.runWithContext(() => localData()))
      .catch((error) =>
        console.error("Could not start the local collections:", error),
      );
  if ("requestIdleCallback" in window) requestIdleCallback(start);
  else setTimeout(start, 200);
});
