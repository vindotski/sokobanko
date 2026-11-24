/**
 * A page's title, description, canonical URL and link previews. The site's
 * address is runtimeConfig.public.siteUrl (NUXT_PUBLIC_SITE_URL), so links
 * are absolute whatever proxy the request came through.
 */
export function usePageSeo(page: {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  path: MaybeRefOrGetter<string>;
}) {
  const site = useRuntimeConfig().public.siteUrl.replace(/\/$/, "");
  const url = computed(() => `${site}${toValue(page.path)}`);
  const image = `${site}/og.png`;
  useSeoMeta({
    title: page.title,
    description: page.description,
    ogTitle: page.title,
    ogDescription: page.description,
    ogUrl: url,
    ogType: "website",
    ogSiteName: "Sokoban",
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: "Sokoban: a level in black and white",
    twitterCard: "summary_large_image",
  });
  useHead({ link: [{ rel: "canonical", href: url }] });
}
