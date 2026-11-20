import { VueQueryPlugin } from "@tanstack/vue-query";
import { localData } from "~/collections";

/**
 * TanStack Query and the local collections, in the browser only: one
 * QueryClient for both, and the upload outbox started with the app, so runs
 * left from an earlier visit go out without waiting for a page to need them.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // The user pool's client reads the runtime config, which uploads made later
  // by the outbox can't; make it now.
  useUserPool();
  const { queryClient } = localData();
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });
});
