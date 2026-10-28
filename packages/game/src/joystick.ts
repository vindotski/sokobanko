import type { Direction } from "@sokoban/core";
import {
  type ColorSource,
  Container,
  type FederatedPointerEvent,
  Graphics,
} from "pixi.js";
import { directionFromVector, StepRepeater } from "./input.ts";

/** Half the side of the square base and knob. */
const RADIUS = 56;
const KNOB_RADIUS = 24;
const DEAD_ZONE = 16;
const REPEAT_MS = 180;

/**
 * Floating joystick: appears where a pointer goes down on `target`, follows
 * the drag, and emits a step once the knob leaves the dead zone, repeating
 * while held. Drawn in screen space, so add it on top of the scene.
 */
export class Joystick extends Container {
  private readonly onMove: (direction: Direction) => void;
  private readonly base = new Graphics();
  private readonly knob = new Graphics();
  private readonly repeater = new StepRepeater(REPEAT_MS);
  private pointerId: number | null = null;
  private direction: Direction | null = null;

  constructor(
    target: Container,
    color: ColorSource,
    onMove: (direction: Direction) => void,
  ) {
    super();
    this.onMove = onMove;
    this.visible = false;
    this.addChild(this.base, this.knob);
    this.setColor(color);

    target
      .on("pointerdown", this.handleDown)
      .on("globalpointermove", this.handleDrag)
      .on("pointerup", this.handleUp)
      .on("pointerupoutside", this.handleUp);
  }

  /** Redraws in `color`, e.g. the board's foreground when the theme changes. */
  setColor(color: ColorSource) {
    this.base
      .clear()
      .rect(-RADIUS, -RADIUS, RADIUS * 2, RADIUS * 2)
      .fill({ color, alpha: 0.1 })
      .stroke({ width: 2, color, alpha: 0.4 });
    this.knob
      .clear()
      .rect(-KNOB_RADIUS, -KNOB_RADIUS, KNOB_RADIUS * 2, KNOB_RADIUS * 2)
      .fill({ color, alpha: 0.4 });
  }

  /** Call once per frame. */
  update(deltaMs: number) {
    const step = this.repeater.update(this.direction, deltaMs);
    if (step) this.onMove(step);
  }

  private handleDown = (e: FederatedPointerEvent) => {
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.position.copyFrom(e.global);
    this.knob.position.set(0, 0);
    this.visible = true;
  };

  private handleDrag = (e: FederatedPointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    const dx = e.global.x - this.x;
    const dy = e.global.y - this.y;
    // Keep the knob inside the square base.
    const clamp = Math.min(1, RADIUS / Math.max(Math.abs(dx), Math.abs(dy)));
    this.knob.position.set(dx * clamp, dy * clamp);
    this.direction = directionFromVector(dx, dy, DEAD_ZONE);
  };

  private handleUp = (e: FederatedPointerEvent) => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.direction = null;
    this.visible = false;
  };
}
