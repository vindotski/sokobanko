import type { Container, FederatedPointerEvent } from "pixi.js";

export interface Point {
  x: number;
  y: number;
}

/** Two fingers on the screen. */
export type Pinch = readonly [Point, Point];

/**
 * How two fingers moved between two moments: the zoom factor (their spread),
 * where they are now (to zoom around), and how far their midpoint moved (to
 * pan by).
 */
export function pinchUpdate(before: Pinch, after: Pinch) {
  const spread = (p: Pinch) => Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
  const middle = (p: Pinch) => ({
    x: (p[0].x + p[1].x) / 2,
    y: (p[0].y + p[1].y) / 2,
  });
  const from = middle(before);
  const to = middle(after);
  const start = spread(before);
  return {
    factor: start > 0 ? spread(after) / start : 1,
    at: to,
    pan: { x: to.x - from.x, y: to.y - from.y },
  };
}

/** The parts of a wheel event that decide what it does. */
export type Wheel = Pick<
  WheelEvent,
  "deltaX" | "deltaY" | "deltaMode" | "ctrlKey" | "metaKey" | "shiftKey"
>;

/** Pixels a wheel "line" (1) or "page" (2) is worth, for mice that report those. */
function wheelPixels(e: Wheel, delta: number) {
  if (e.deltaMode === 1) return delta * 16;
  if (e.deltaMode === 2) return delta * 400;
  return delta;
}

/**
 * Turns a wheel event into a camera action: with Ctrl or ⌘ (which is also
 * what a trackpad pinch sends) it zooms around the cursor; otherwise it pans,
 * Shift turning a vertical wheel sideways.
 */
export function wheelAction(
  e: Wheel,
): { kind: "zoom"; factor: number } | { kind: "pan"; dx: number; dy: number } {
  const dx = wheelPixels(e, e.deltaX);
  const dy = wheelPixels(e, e.deltaY);
  if (e.ctrlKey || e.metaKey) {
    return { kind: "zoom", factor: Math.exp(-dy * 0.01) };
  }
  if (e.shiftKey && dx === 0) return { kind: "pan", dx: -dy, dy: 0 };
  return { kind: "pan", dx: -dx, dy: -dy };
}

export interface GestureHandlers {
  /** A second finger went down: the joystick should let go. */
  onPinchStart: () => void;
  /** Zoom by `factor` around `at`, in canvas pixels. */
  onZoom: (factor: number, at: Point) => void;
  /** Drag the board by (dx, dy) pixels. */
  onPan: (dx: number, dy: number) => void;
}

/**
 * Two-finger pinch and pan on `stage`, and the wheel on `canvas`. One finger
 * is left to the joystick. Returns a function that stops listening.
 */
export function listenToGestures(
  stage: Container,
  canvas: HTMLCanvasElement,
  handlers: GestureHandlers,
) {
  const touches = new Map<number, Point>();
  const pinch = (): Pinch | undefined => {
    const [a, b] = [...touches.values()];
    return a && b ? [a, b] : undefined;
  };

  const handleDown = (e: FederatedPointerEvent) => {
    if (e.pointerType !== "touch") return;
    touches.set(e.pointerId, { x: e.global.x, y: e.global.y });
    if (touches.size === 2) handlers.onPinchStart();
  };
  const handleMove = (e: FederatedPointerEvent) => {
    if (!touches.has(e.pointerId)) return;
    const before = pinch();
    touches.set(e.pointerId, { x: e.global.x, y: e.global.y });
    const after = pinch();
    if (!before || !after) return;
    const { factor, at, pan } = pinchUpdate(before, after);
    handlers.onZoom(factor, at);
    handlers.onPan(pan.x, pan.y);
  };
  const handleUp = (e: FederatedPointerEvent) => {
    touches.delete(e.pointerId);
  };
  stage
    .on("pointerdown", handleDown)
    .on("globalpointermove", handleMove)
    .on("pointerup", handleUp)
    .on("pointerupoutside", handleUp)
    .on("pointercancel", handleUp);

  const handleWheel = (e: WheelEvent) => {
    // The page would otherwise scroll, or the browser zoom.
    e.preventDefault();
    const action = wheelAction(e);
    if (action.kind === "zoom") {
      const box = canvas.getBoundingClientRect();
      handlers.onZoom(action.factor, {
        x: e.clientX - box.left,
        y: e.clientY - box.top,
      });
    } else {
      handlers.onPan(action.dx, action.dy);
    }
  };
  canvas.addEventListener("wheel", handleWheel, { passive: false });

  return () => {
    stage
      .off("pointerdown", handleDown)
      .off("globalpointermove", handleMove)
      .off("pointerup", handleUp)
      .off("pointerupoutside", handleUp)
      .off("pointercancel", handleUp);
    canvas.removeEventListener("wheel", handleWheel);
  };
}
