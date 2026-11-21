/** When the privacy policy, terms and legal notice last changed. */
export const LEGAL_UPDATED = "2026-11-21";

/**
 * A postal address from settings, as lines. NUXT_PUBLIC_LEGAL_ADDRESS
 * separates them with newlines, or with a literal `\n` where a settings form
 * can't hold one.
 */
export function addressLines(address: string | undefined): string[] {
  return (address ?? "")
    .split(/\r?\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
