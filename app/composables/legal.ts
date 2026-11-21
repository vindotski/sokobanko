/**
 * Who runs Sokobanko, from settings (runtimeConfig.public.legal): for the
 * privacy policy, terms and legal notice.
 */
export function useLegal() {
  const legal = useRuntimeConfig().public.legal;
  return {
    name: legal.name,
    email: legal.email,
    country: legal.country,
    address: addressLines(legal.address),
  };
}
