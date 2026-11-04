import { type ContentItem, levelsFromItems } from "../spotcraft/levels";

/**
 * Published levels in play order, from the `sokobanko` project on Spotcraft
 * (runtimeConfig.spotcraftUrl, overridden by NUXT_SPOTCRAFT_URL). Cached for a
 * minute and refreshed in the background; a failed refresh keeps serving the
 * last levels it got.
 */
export const getLevels = defineCachedFunction(
  async () => {
    const { spotcraftUrl } = useRuntimeConfig();
    const { items } = await $fetch<{ items: ContentItem[] }>(
      "/v1/projects/sokobanko/content/levels/",
      { baseURL: spotcraftUrl, headers: deliveryHeaders() },
    );
    return levelsFromItems(items);
  },
  { name: "levels", maxAge: 60 },
);
