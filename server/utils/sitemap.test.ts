import { describe, expect, it } from "vitest";
import { PAGES, sitemap } from "./sitemap";

describe("sitemap", () => {
  it("lists every path on the site", () => {
    const xml = sitemap("https://sokobanko.app", ["/", "/levels/first-push"]);
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(xml).toContain("<loc>https://sokobanko.app/</loc>");
    expect(xml).toContain("<loc>https://sokobanko.app/levels/first-push</loc>");
  });

  it("escapes what XML needs escaped", () => {
    expect(sitemap("https://a.example", ["/?a=1&b=<2>"])).toContain(
      "<loc>https://a.example/?a=1&amp;b=&lt;2&gt;</loc>",
    );
  });

  it("lists the map, Help and the legal pages", () => {
    expect(PAGES).toEqual(["/", "/help", "/privacy", "/terms", "/legal"]);
  });
});
