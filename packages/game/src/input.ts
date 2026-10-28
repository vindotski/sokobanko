import type { Direction } from "@sokoban/core";

/**
 * Snaps a drag vector to the dominant axis, or `null` inside the dead zone.
 * Uses screen coordinates, so positive `dy` is down.
 */
export function directionFromVector(
  dx: number,
  dy: number,
  deadZone: number,
): Direction | null {
  if (Math.hypot(dx, dy) < deadZone) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "R" : "L";
  return dy > 0 ? "D" : "U";
}

// Keyed by physical key, so WASD stays in place on other layouts (ZQSD on
// AZERTY) and ignores Caps Lock. A Map, so codes like "constructor" don't hit
// Object.prototype.
const MOVEMENT_KEYS = new Map<string, Direction>([
  ["ArrowUp", "U"],
  ["ArrowDown", "D"],
  ["ArrowLeft", "L"],
  ["ArrowRight", "R"],
  ["KeyW", "U"],
  ["KeyS", "D"],
  ["KeyA", "L"],
  ["KeyD", "R"],
]);

/**
 * Direction for a `KeyboardEvent.code` (arrows or WASD), or `null` for any
 * other key.
 */
export function directionFromKey(code: string): Direction | null {
  return MOVEMENT_KEYS.get(code) ?? null;
}

/**
 * Turns a held direction into discrete steps: one step as soon as the
 * direction changes, then one every `intervalMs` while it stays the same.
 */
export class StepRepeater {
  private readonly intervalMs: number;
  private current: Direction | null = null;
  private elapsed = 0;

  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  /** Call once per frame; returns the step to take this frame, if any. */
  update(direction: Direction | null, deltaMs: number): Direction | null {
    if (direction !== this.current) {
      this.current = direction;
      this.elapsed = 0;
      return direction;
    }
    if (!direction) return null;

    this.elapsed += deltaMs;
    if (this.elapsed < this.intervalMs) return null;
    this.elapsed -= this.intervalMs;
    return direction;
  }
}
