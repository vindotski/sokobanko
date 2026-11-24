import { legal } from "@kodentuzo/spotkit/client";

/**
 * The instance's legal facts: who runs Sokoban and what the server does with
 * personal data, for the privacy notice, terms and legal notice. Read from
 * `/_spotcraft/legal.json` on the app's own address (PUBLIC_URL, which
 * Spotcraft sets), or from LEGAL_URL when that is set: `spotkit dev` writes
 * it, and the self-hosting stack points it at its Caddy. Without facts, the
 * pages say so rather than render from nothing.
 */
export default defineCachedEventHandler(
  async () => {
    try {
      return await legal({
        origin: process.env.PUBLIC_URL || undefined,
        legalUrl: process.env.LEGAL_URL || undefined,
      });
    } catch (error) {
      throw createError({
        statusCode: 503,
        message: error instanceof Error ? error.message : "No legal facts",
      });
    }
  },
  // A minute, so a page doesn't call the legal slot each time, and a change
  // of the owner's details shows soon.
  { maxAge: 60 },
);
