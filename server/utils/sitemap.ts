const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A sitemap (sitemaps.org) for `paths` on `site`. */
export function sitemap(site: string, paths: string[]): string {
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(`${site}${path}`)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
