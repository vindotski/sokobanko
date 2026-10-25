import { describe, expect, it } from "vitest";
import { centerAxis, ease, followAxis, tileSize } from "./camera.ts";

describe("tileSize", () => {
  it("is 10% of the play area's shorter side", () => {
    expect(tileSize({ width: 1200, height: 600 })).toBe(60);
  });

  it("is clamped to 32-80 px", () => {
    expect(tileSize({ width: 200, height: 900 })).toBe(32);
    expect(tileSize({ width: 2000, height: 1500 })).toBe(80);
  });
});

describe("centerAxis", () => {
  it("centres a board that fits", () => {
    expect(centerAxis(1000, 400, 50)).toBe(300);
  });

  it("puts the player in the middle of a larger board", () => {
    expect(centerAxis(1000, 3000, 1500)).toBe(-1000);
  });

  it("does not scroll past the board's edges near a corner", () => {
    expect(centerAxis(1000, 3000, 100)).toBe(0);
    expect(centerAxis(1000, 3000, 2950)).toBe(-2000);
  });
});

describe("followAxis", () => {
  it("centres a board that fits, wherever the player is", () => {
    expect(followAxis(1000, 400, 350, -123)).toBe(300);
  });

  it("stays still while the player is inside the dead zone", () => {
    // Player on screen at 500, inside 300-700.
    expect(followAxis(1000, 3000, 1500, -1000)).toBe(-1000);
  });

  it("moves just enough when the player passes the dead zone", () => {
    // Player on screen at 750, so the board moves left by 50.
    expect(followAxis(1000, 3000, 1750, -1000)).toBe(-1050);
    // Player on screen at 250, so the board moves right by 50.
    expect(followAxis(1000, 3000, 1250, -1000)).toBe(-950);
  });

  it("does not scroll past the board's edges", () => {
    expect(followAxis(1000, 3000, 50, -100)).toBe(0);
    expect(followAxis(1000, 3000, 2990, -1500)).toBe(-2000);
  });
});

describe("ease", () => {
  it("does not move without elapsed time", () => {
    expect(ease(0, 100, 0)).toBe(0);
  });

  it("moves part of the way, then converges", () => {
    const step = ease(0, 100, 16);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(100);
    expect(ease(0, 100, 2000)).toBeCloseTo(100);
  });
});
