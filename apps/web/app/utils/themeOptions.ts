import { MonitorIcon, MoonIcon, SunIcon } from "@lucide/vue";

/** Light, dark, or follow the system: @nuxtjs/color-mode's preferences. */
export const themeOptions = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;
