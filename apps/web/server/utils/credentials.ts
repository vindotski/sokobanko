/**
 * Headers for delivery reads of the levels: Sokobanko's own key
 * (NUXT_SPOTCRAFT_KEY, Spotcraft's decision 50), since the sokobanko project
 * is private. Never sent from the browser.
 */
export function deliveryHeaders(): Record<string, string> {
  const { spotcraftKey } = useRuntimeConfig();
  return spotcraftKey ? { "x-spotcraft-key": spotcraftKey } : {};
}
