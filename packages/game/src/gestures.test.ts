import { describe, expect, it } from "vitest";
import { pinchUpdate, type Wheel, wheelAction } from "./gestures.ts";

describe("pinchUpdate", () => {
  it("zooms by how far the fingers spread", () => {
    const update = pinchUpdate(
      [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      [
        { x: 50, y: 100 },
        { x: 250, y: 100 },
      ],
    );
    expect(update.factor).toBe(2);
    expect(update.at).toEqual({ x: 150, y: 100 });
    expect(update.pan).toEqual({ x: 0, y: 0 });
  });

  it("pans by how far the fingers moved together", () => {
    const update = pinchUpdate(
      [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      [
        { x: 130, y: 60 },
        { x: 230, y: 60 },
      ],
    );
    expect(update.factor).toBe(1);
    expect(update.pan).toEqual({ x: 30, y: -40 });
  });

  it("doesn't zoom from fingers on the same spot", () => {
    const spot = { x: 10, y: 10 };
    expect(pinchUpdate([spot, spot], [spot, { x: 20, y: 10 }]).factor).toBe(1);
  });
});

describe("wheelAction", () => {
  const wheel = (init: Partial<Wheel>): Wheel => ({
    deltaX: 0,
    deltaY: 0,
    deltaMode: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...init,
  });

  it("pans with a plain wheel or trackpad scroll", () => {
    expect(wheelAction(wheel({ deltaX: 5, deltaY: 20 }))).toEqual({
      kind: "pan",
      dx: -5,
      dy: -20,
    });
  });

  it("pans sideways with Shift and a vertical wheel", () => {
    expect(wheelAction(wheel({ deltaY: 20, shiftKey: true }))).toEqual({
      kind: "pan",
      dx: -20,
      dy: 0,
    });
  });

  it("zooms with Ctrl or ⌘, as a trackpad pinch sends", () => {
    const zoomIn = wheelAction(wheel({ deltaY: -50, ctrlKey: true }));
    const zoomOut = wheelAction(wheel({ deltaY: 50, metaKey: true }));
    expect(zoomIn.kind).toBe("zoom");
    expect(zoomIn.kind === "zoom" && zoomIn.factor).toBeGreaterThan(1);
    expect(zoomOut.kind === "zoom" && zoomOut.factor).toBeLessThan(1);
  });
});
