import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const cnPath = new URL("./app/lib/utils.ts", import.meta.url);

export default defineNuxtConfig({
  compatibilityDate: "2026-10-25",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/color-mode", "shadcn-nuxt"],
  app: {
    head: {
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
    // Bundled into the server, so the image needs nothing beside .output:
    // the levels are synced into Postgres and the migrations applied at boot
    // (server/utils/database.ts).
    serverAssets: [
      {
        baseName: "levels",
        dir: fileURLToPath(new URL("../../content/levels", import.meta.url)),
      },
      {
        baseName: "migrations",
        dir: fileURLToPath(new URL("./server/db/migrations", import.meta.url)),
      },
    ],
  },
  runtimeConfig: {
    // The server reads DATABASE_URL, AUTH_SECRET and PUBLIC_URL directly
    // (server/utils/backend.ts); none of them reach the browser.
    public: {
      // The browser signs guests in against Spotcraft (app/lib/spotcraft-auth.ts).
      // NUXT_PUBLIC_SPOTCRAFT_URL overrides it, e.g. for a local Spotcraft.
      spotcraftUrl: "https://api.vin.ski",
    },
  },
});
