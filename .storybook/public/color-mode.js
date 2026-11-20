// Stands in for the inline script @nuxtjs/color-mode puts in the server-
// rendered <head>; its client plugin reads this helper. Storybook drives the
// theme through its own toolbar (preview.ts), so this only reflects <html>.
window.__NUXT_COLOR_MODE__ = {
  preference: "light",
  value: "light",
  getColorScheme: () =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  addColorScheme: (value) => document.documentElement.classList.add(value),
  removeColorScheme: (value) =>
    document.documentElement.classList.remove(value),
};
