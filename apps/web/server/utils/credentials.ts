import type { Credentials } from "../spotcraft/rpc";

/**
 * How Sokobanko's server calls Spotcraft: with its own key (NUXT_SPOTCRAFT_KEY,
 * Spotcraft's decision 50), which reaches only the sokobanko project. Null if
 * it isn't set. Never sent from the browser.
 */
export function spotcraftCredentials(): Credentials | null {
  const { spotcraftKey } = useRuntimeConfig();
  return spotcraftKey ? { key: spotcraftKey } : null;
}

/**
 * Headers for delivery reads (levels, players' files). The sokobanko project
 * is private, so they need the key.
 */
export function deliveryHeaders(): Record<string, string> {
  const { spotcraftKey } = useRuntimeConfig();
  return spotcraftKey ? { "x-spotcraft-key": spotcraftKey } : {};
}
