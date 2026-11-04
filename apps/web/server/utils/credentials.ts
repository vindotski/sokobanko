import type { Credentials } from "../spotcraft/rpc";

/**
 * How Sokobanko's server calls Spotcraft: with its own key (NUXT_SPOTCRAFT_KEY,
 * Spotcraft's decision 50), or else the admin secret, until the key is
 * deployed. Null if neither is set. Never sent from the browser.
 */
export function spotcraftCredentials(): Credentials | null {
  const { spotcraftKey, spotcraftAdminSecret } = useRuntimeConfig();
  if (spotcraftKey) return { key: spotcraftKey };
  if (spotcraftAdminSecret) return { secret: spotcraftAdminSecret };
  return null;
}

/**
 * Headers for delivery reads (levels, players' files): the key if there is
 * one. An open project needs none; a private one needs the key.
 */
export function deliveryHeaders(): Record<string, string> {
  const { spotcraftKey } = useRuntimeConfig();
  return spotcraftKey ? { "x-spotcraft-key": spotcraftKey } : {};
}
