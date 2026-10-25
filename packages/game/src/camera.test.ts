import { describe, expect, it } from "vitest";
import {
  centerAxis,
  ease,
  fitTileSize,
  followAxis,
  tileSize,
  zoomTarget,
} from "./camera.ts";

describe("tileSize", () => {
  it("is 10% of the play area's shorter side", () => {
    expect(tileSize({ width: 1200, height: 600 })).toBe(60);
  });

  it("is clamped to 32-80 px", () => {
    expect(tileSize({ width: 200, height: 900 })).toBe(32);
    expect(tileSize({ width: 2000, height: 1500 })).toBe(80);
  });
});

describe("fitTileSize", () => {
  it("is limited by the tighter axis", () => {
    expect(fitTileSize({ width: 1200, height: 600 }, 30, 20)).toBe(30);
    expect(fitTileSize({ width: 300, height: 600 }, 30, 20)).toBe(10);
  });
});

describe("zoomTarget", () => {
  const area = { width: 1200, height: 600 };

  it("uses the normal zoom outside the overview", () => {
    expect(zoomTarget(area, 30, 20, false)).toEqual({
      tile: 60,
      available: true,
    });
  });

  it("zooms out to fit a big board in the overview", () => {
    expect(zoomTarget(area, 30, 20, true)).toEqual({
      tile: 30,
      available: true,
    });
  });

  it("never zooms in on a board that already fits", () => {
    expect(zoomTarget(area, 7, 3, true)).toEqual({
      tile: 60,
      available: false,
    });
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
