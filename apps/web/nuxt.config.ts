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
  nitro: {
    // A plain Node server (`node .output/server/index.mjs`), run in a
    // container on Spotcraft; see the Dockerfile.
    preset: "node-server",
    // The server reads DATABASE_URL, AUTH_SECRET and PUBLIC_URL from the
    // environment (server/utils/backend.ts); none of them reach the browser.
    // Bundled into the server, so the image needs nothing beside .output:
    // the migrations, which also hold the levels, are applied at boot
    // (server/utils/database.ts).
    serverAssets: [
      {
        baseName: "migrations",
        dir: fileURLToPath(new URL("./server/db/migrations", import.meta.url)),
      },
    ],
  },
});
