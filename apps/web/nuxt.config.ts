import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const cnPath = new URL("./app/lib/utils.ts", import.meta.url);

export default defineNuxtConfig({
  compatibilityDate: "2026-10-25",
  devtools: { enabled: true },
  modules: [
    "@pinia/nuxt",
    "@nuxtjs/supabase",
    "@nuxtjs/color-mode",
    "shadcn-nuxt",
  ],
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
  runtimeConfig: {
    // Spotcraft, for levels (server/utils/levels.ts) and for checking a
    // player's session (server/utils/user.ts). NUXT_SPOTCRAFT_URL overrides it.
    spotcraftUrl: "https://api.vin.ski",
    // The completions database, used only by the server, with the secret key
    // (server/utils/supabase.ts). NUXT_SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY.
    supabaseUrl: "",
    supabaseSecretKey: "",
    public: {
      // The browser signs guests in against Spotcraft (app/lib/spotcraft-auth.ts).
      // NUXT_PUBLIC_SPOTCRAFT_URL overrides it, e.g. for a local Spotcraft.
      spotcraftUrl: "https://api.vin.ski",
    },
  },
  supabase: {
    // Signed-out visitors can still play; there is no login page to send them to.
    redirect: false,
    // Regenerate with `pnpm db:types` after schema changes.
    types: "~/types/database.types.ts",
    cookieOptions: {
      // The default 8 hours would drop anonymous sessions, and their progress,
      // daily. 400 days is the longest lifetime browsers allow.
      maxAge: 60 * 60 * 24 * 400,
    },
  },
});
