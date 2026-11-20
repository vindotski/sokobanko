import { CircleHelpIcon, MapIcon, TrophyIcon } from "@lucide/vue";

/**
 * The app's sections: the tab bar on phones, the sidebar on wider screens.
 * Settings isn't one; it's an action, a sheet over any of them.
 */
export const sections = [
  { to: "/", label: "Play", icon: MapIcon },
  { to: "/progress", label: "Progress", icon: TrophyIcon },
  { to: "/help", label: "Help", icon: CircleHelpIcon },
] as const;

/** Whether `path` belongs to a section: Play also owns the level cards. */
export function inSection(to: string, path: string) {
  if (to === "/") return path === "/" || path.startsWith("/levels/");
  return path === to || path.startsWith(`${to}/`);
}
