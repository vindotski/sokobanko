import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const cnPath = new URL("./app/lib/utils.ts", import.meta.url);

export default defineNuxtConfig({
  compatibilityDate: "2026-10-25",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/color-mode", "shadcn-nuxt"],
  app: {
    head: {
      title: "Sokobanko",
      // Native scrollbars and form controls follow the theme too.
      meta: [{ name: "color-scheme", content: "light dark" }],
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
      // Where the browser reaches Spotcraft's user pool. Empty, so it's the
      // app's own /_spotcraft/auth: on Spotcraft, and in `nuxt dev` through
      // the proxy below, so phones on the same network can save too.
      authUrl: "",
    },
  },
  $development: {
    nitro: {
      // The local pool (`spotcraft dev`, AUTH_URL in .env) listens on
      // 127.0.0.1 only; the dev server passes /_spotcraft/auth on to it, as
      // Spotcraft's Caddy does in production.
      devProxy: process.env.AUTH_URL
        ? {
            "/_spotcraft/auth": {
              target: process.env.AUTH_URL,
              changeOrigin: true,
            },
          }
        : {},
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
