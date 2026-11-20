import type { GamePalette } from "@sokobanko/game";

const PALETTE_VARS: Record<keyof GamePalette, string> = {
  wall: "--board-wall",
  floor: "--board-floor",
  goal: "--board-goal",
  box: "--board-box",
  boxOnGoal: "--board-box-on-goal",
  player: "--board-player",
};

/**
 * The theme's --board-* colors as CSS strings, for canvases that can't use
 * CSS themselves. Client-only; read again after the theme changes.
 */
export function readBoardPalette(): Partial<Record<keyof GamePalette, string>> {
  const style = getComputedStyle(document.documentElement);
  const palette: Partial<Record<keyof GamePalette, string>> = {};
  for (const [key, name] of Object.entries(PALETTE_VARS)) {
    const value = style.getPropertyValue(name).trim();
    if (value) palette[key as keyof GamePalette] = value;
  }
  return palette;
}
