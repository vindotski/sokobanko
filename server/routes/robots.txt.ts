/** Crawl the map, level cards and Help; skip the game, Progress and the API. */
export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, "");
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /play",
    "Disallow: /progress",
    "Disallow: /api/",
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");
});
