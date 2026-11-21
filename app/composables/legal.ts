import type { LegalFacts } from "@kodentuzo/spotkit";
import { formatDate } from "@kodentuzo/spotstrap/blocks";

/**
 * The instance's legal facts (server/api/legal.get.ts), for the privacy
 * policy, terms and legal notice. Fetched once per page, on the server.
 */
export function useLegalFacts() {
  const { data: facts, error } = useFetch<LegalFacts>("/api/legal", {
    key: "legal-facts",
  });
  /** "21 November 2026", when the facts last changed. */
  const updated = computed(() =>
    facts.value ? formatDate(facts.value.updated) : "",
  );
  return { facts, error, updated };
}
