/**
 * The pages search engines should know about: the site's own (PAGES) and
 * every level's card (server-rendered, pages/index/levels/[id].vue). The
 * game and Progress are personal and left out (routeRules, robots.txt).
 */
export default defineEventHandler(async (event) => {
  const site = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, "");
  const levels = await getLevels();
  const paths = [...PAGES, ...levels.map((level) => `/levels/${level.id}`)];
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return sitemap(site, paths);
});
