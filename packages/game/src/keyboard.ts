import type { Direction } from "@sokoban/core";
import { actionFromKey, directionFromKey, type KeyAction } from "./input.ts";

export interface KeyHandlers {
  /** Arrow and WASD keys, including the keyboard's auto-repeat while held. */
  onStep: (direction: Direction) => void;
  /** Space held down (true) and released (false). */
  onPeek: (peeking: boolean) => void;
  /** Z or U (undo), Y (redo) and R (restart). Undo and redo auto-repeat. */
  onAction: (action: KeyAction) => void;
}

/**
 * Listens for game keys anywhere on the page. Returns a function that stops
 * listening.
 */
export function listenToKeys({ onStep, onPeek, onAction }: KeyHandlers) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (isTyping(e.target) || inDialog(e.target)) return;

    // Space and arrow keys would otherwise scroll the page.
    if (e.code === "Space") {
      e.preventDefault();
      if (!e.repeat) onPeek(true);
      return;
    }
    const direction = directionFromKey(e.code);
    if (direction) {
      e.preventDefault();
      onStep(direction);
      return;
    }
    const action = actionFromKey(e.key);
    if (!action) return;
    e.preventDefault();
    // Holding R shouldn't keep restarting; holding Z walks back step by step.
    if (action === "restart" && e.repeat) return;
    onAction(action);
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space") onPeek(false);
  };
  // A key released while the page is in the background never sends keyup.
  const handleBlur = () => onPeek(false);

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", handleBlur);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleBlur);
  };
}

// Keys inside a dialog belong to its buttons, not the game.
function inDialog(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[role="dialog"]');
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
  );
}
