/**
 * The legal notice needs a postal address, which is set where Sokobanko is
 * deployed (NUXT_PUBLIC_LEGAL_ADDRESS), never in the repository. Say so when
 * a production server starts without one.
 */
export default defineNitroPlugin(() => {
  if (import.meta.dev || import.meta.prerender) return;
  if (!useRuntimeConfig().public.legal.address.trim()) {
    console.warn(
      "NUXT_PUBLIC_LEGAL_ADDRESS is not set: the legal notice has no address",
    );
  }
});
