import type { Direction } from "@sokoban/core";
import { Container, type FederatedPointerEvent, Graphics } from "pixi.js";
import { directionFromVector, StepRepeater } from "./input.ts";

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
  private readonly knob = new Graphics()
    .circle(0, 0, KNOB_RADIUS)
    .fill({ color: 0x000000, alpha: 0.3 });
  private readonly repeater = new StepRepeater(REPEAT_MS);
  private pointerId: number | null = null;
  private direction: Direction | null = null;

  constructor(target: Container, onMove: (direction: Direction) => void) {
    super();
    this.onMove = onMove;
    this.visible = false;
    this.addChild(
      new Graphics()
        .circle(0, 0, RADIUS)
        .fill({ color: 0x000000, alpha: 0.1 })
        .stroke({ width: 2, color: 0x000000, alpha: 0.2 }),
      this.knob,
    );

    target
      .on("pointerdown", this.handleDown)
      .on("globalpointermove", this.handleDrag)
      .on("pointerup", this.handleUp)
      .on("pointerupoutside", this.handleUp);
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
    const clamp = Math.min(1, RADIUS / Math.hypot(dx, dy));
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
