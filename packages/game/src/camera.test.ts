import { describe, expect, it } from "vitest";
import {
  centerAxis,
  clampTile,
  ease,
  fitTileSize,
  followAxis,
  panAxis,
  tileSize,
  zoomAround,
  zoomBounds,
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

describe("zoomBounds", () => {
  const area = { width: 1200, height: 600 };

  it("zooms out no further than the whole level", () => {
    expect(zoomBounds(area, 30, 20)).toEqual({
      normal: 60,
      fit: 30,
      min: 30,
      max: 96,
    });
  });

  it("starts at the default zoom when the level fits already", () => {
    expect(zoomBounds(area, 5, 5).min).toBe(60);
  });
});

describe("clampTile", () => {
  const bounds = zoomBounds({ width: 1200, height: 600 }, 30, 20);

  it("keeps the zoom within its bounds", () => {
    expect(clampTile(10, bounds)).toBe(30);
    expect(clampTile(50, bounds)).toBe(50);
    expect(clampTile(200, bounds)).toBe(96);
  });
});

describe("zoomAround", () => {
  it("keeps the point under the focus still", () => {
    // The board point at 100 px sits under the focus at 300; doubling the
    // zoom moves the board so that it still does.
    const offset = zoomAround(200, 40, 80, 300);
    expect(offset).toBe(100);
    expect(((300 - offset) / 80) * 40).toBe(100);
  });

  it("changes nothing at the same zoom", () => {
    expect(zoomAround(-50, 60, 60, 123)).toBe(-50);
  });
});

describe("panAxis", () => {
  it("moves the board with the drag", () => {
    expect(panAxis(500, 2000, -600, 100)).toBe(-500);
  });

  it("stops at the board's edges", () => {
    expect(panAxis(500, 2000, -100, 300)).toBe(0);
    expect(panAxis(500, 2000, -1400, -300)).toBe(-1500);
  });

  it("keeps a board that fits centred", () => {
    expect(panAxis(500, 300, 100, 80)).toBe(100);
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
