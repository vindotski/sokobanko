import type { Direction } from "@sokobanko/core";
import { directionFromKey } from "./input.ts";

/**
 * Steps on arrow keys anywhere on the page, including the keyboard's own
 * auto-repeat while a key is held. Returns a function that stops listening.
 */
export function listenToArrowKeys(onStep: (direction: Direction) => void) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (isTyping(e.target)) return;
    const direction = directionFromKey(e.key);
    if (!direction) return;

    // Arrow keys would otherwise scroll the page.
    e.preventDefault();
    onStep(direction);
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
  );
}
