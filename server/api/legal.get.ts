import { legalFacts } from "@kodentuzo/spotkit";

/**
 * The instance's legal facts (LEGAL_FACTS, which Spotcraft sets and
 * `spotcraft dev` writes): who runs Sokobanko and what the server does with
 * personal data, for the privacy policy, terms and legal notice. Without
 * them, the pages say so rather than render from nothing.
 */
export default defineEventHandler(() => {
  try {
    return legalFacts();
  } catch (error) {
    throw createError({
      statusCode: 503,
      message: error instanceof Error ? error.message : "No legal facts",
    });
  }
});
