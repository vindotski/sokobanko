import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const cnPath = new URL("./app/lib/utils.ts", import.meta.url);
// The release version, shown in the footer, is the root package's.
const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineNuxtConfig({
  compatibilityDate: "2026-10-25",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/color-mode", "shadcn-nuxt"],
  app: {
    head: {
      title: "Sokobanko",
      // Native scrollbars and form controls follow the theme too.
      meta: [{ name: "color-scheme", content: "light dark" }],
      // Icons and the web app manifest live in public/. Pages set their own
      // titles and link previews (composables/seo.ts).
      link: [
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },
  css: [
    // Self-hosted Geist, the same typefaces as www.vin.ski.
    "@fontsource-variable/geist",
    "@fontsource-variable/geist-mono",
    "~/assets/css/main.css",
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        // shadcn components import `cn` from the package; use our copy that
        // knows the custom type scale instead (app/lib/utils.ts).
        name: "sokoban-cn",
        enforce: "pre",
        resolveId(id) {
          if (id === "cn") return fileURLToPath(cnPath);
        },
      },
    ],
  },
  colorMode: {
    // Follow the system; a light/dark toggle can set `preference` later.
    preference: "system",
    fallback: "light",
    // `dark` rather than `dark-mode`, which is what shadcn's variant expects.
    classSuffix: "",
  },
  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },
  runtimeConfig: {
    public: {
      // Where the browser reaches Spotcraft's user pool. Empty in a build, so
      // the app's own /_spotcraft/auth is used; `nuxt dev` reads AUTH_URL from
      // .env, where `spotcraft dev` puts the local pool.
      authUrl: process.env.AUTH_URL ?? "",
      // Link previews need absolute URLs (og:image, og:url). Set
      // NUXT_PUBLIC_SITE_URL to serve the app from another domain.
      siteUrl: "https://sokobanko.app",
      version,
    },
  },
  $production: {
    routeRules: {
      // Spotcraft's Caddy adds HSTS, nosniff, Referrer-Policy, X-Frame-Options,
      // Permissions-Policy and COOP; the CSP is the app's own. Production
      // only, as Vite's dev server needs more. 'unsafe-inline' is for the
      // inline scripts and styles Nuxt and color-mode write into the page.
      "/**": {
        headers: {
          "content-security-policy": [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      },
    },
  },
  nitro: {
    // A plain Node server (`node .output/server/index.mjs`), run in a
    // container on Spotcraft; see the Dockerfile.
    preset: "node-server",
    // The server reads DATABASE_URL and the AUTH_* settings from the
    // environment (server/utils/db.ts, server/utils/userPool.ts).
    // The migrations, which also hold the levels, are bundled into the server,
    // so the image needs nothing beside .output: Spotcraft runs them with
    // `node .output/server/index.mjs migrate` (server/plugins/database.ts).
    serverAssets: [
      {
        baseName: "migrations",
        dir: fileURLToPath(new URL("./server/db/migrations", import.meta.url)),
      },
    ],
  },
});
