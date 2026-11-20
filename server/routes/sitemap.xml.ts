/**
 * The pages search engines should know about: the map, Help, and every
 * level's card (server-rendered, pages/index/levels/[id].vue). The game and
 * Progress are personal and left out (routeRules, robots.txt).
 */
export default defineEventHandler(async (event) => {
  const site = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, "");
  const levels = await getLevels();
  const paths = ["/", "/help", ...levels.map((level) => `/levels/${level.id}`)];
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return sitemap(site, paths);
});
