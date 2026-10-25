import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-25",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/supabase", "shadcn-nuxt"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
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
