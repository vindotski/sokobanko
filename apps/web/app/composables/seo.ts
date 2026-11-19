/**
 * A page's title, description and link preview (Open Graph and X card).
 * Every preview uses the same board image, public/og-image.png. Previews
 * need absolute URLs, so they're built on the `siteUrl` runtime config.
 */
export function usePageSeo({
  title,
  description,
  index = true,
}: {
  /** The page's own title; the site name is added after it. */
  title?: string;
  description: string;
  /** False keeps search engines off a page, such as a player's profile. */
  index?: boolean;
}) {
  const { siteUrl } = useRuntimeConfig().public;
  const route = useRoute();
  const fullTitle = title ? `${title} · Sokobanko` : "Sokobanko";
  const url = new URL(route.path, siteUrl).href;
  useHead({ link: [{ rel: "canonical", href: url }] });
  useSeoMeta({
    title: fullTitle,
    description,
    ogTitle: fullTitle,
    ogDescription: description,
    ogType: "website",
    ogSiteName: "Sokobanko",
    ogUrl: url,
    ogImage: new URL("/og-image.png", siteUrl).href,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt:
      "A Sokobanko board: boxes, goals and the player in a walled room.",
    twitterCard: "summary_large_image",
    robots: index ? undefined : "noindex",
  });
}
