import { describe, expect, it } from "vitest";
import {
  directionFromKey,
  directionFromVector,
  StepRepeater,
} from "./input.ts";

describe("directionFromKey", () => {
  it("maps arrow keys to directions", () => {
    expect(directionFromKey("ArrowUp")).toBe("U");
    expect(directionFromKey("ArrowDown")).toBe("D");
    expect(directionFromKey("ArrowLeft")).toBe("L");
    expect(directionFromKey("ArrowRight")).toBe("R");
  });

  it("maps WASD to directions", () => {
    expect(directionFromKey("KeyW")).toBe("U");
    expect(directionFromKey("KeyS")).toBe("D");
    expect(directionFromKey("KeyA")).toBe("L");
    expect(directionFromKey("KeyD")).toBe("R");
  });

  it("ignores other keys", () => {
    // Characters rather than physical key codes.
    expect(directionFromKey("w")).toBeNull();
    expect(directionFromKey("KeyQ")).toBeNull();
    expect(directionFromKey("Enter")).toBeNull();
    expect(directionFromKey("constructor")).toBeNull();
  });
});

describe("directionFromVector", () => {
  it("returns null inside the dead zone", () => {
    expect(directionFromVector(0, 0, 10)).toBeNull();
    expect(directionFromVector(6, -6, 10)).toBeNull();
  });

  it("snaps to the dominant axis", () => {
    expect(directionFromVector(20, 5, 10)).toBe("R");
    expect(directionFromVector(-20, 5, 10)).toBe("L");
    expect(directionFromVector(5, 20, 10)).toBe("D");
    expect(directionFromVector(5, -20, 10)).toBe("U");
  });

  it("prefers the vertical axis on an exact diagonal", () => {
    expect(directionFromVector(20, 20, 10)).toBe("D");
  });
});

describe("StepRepeater", () => {
  it("steps immediately when a direction starts", () => {
    const r = new StepRepeater(100);
    expect(r.update(null, 16)).toBeNull();
    expect(r.update("R", 16)).toBe("R");
  });

  it("repeats every interval while held", () => {
    const r = new StepRepeater(100);
    r.update("U", 16);

    const steps = Array.from({ length: 25 }, () => r.update("U", 20));
    expect(steps.filter(Boolean)).toHaveLength(5);
  });

  it("restarts the interval when the direction changes", () => {
    const r = new StepRepeater(100);
    r.update("L", 16);
    r.update("L", 90);
    expect(r.update("D", 16)).toBe("D");
    expect(r.update("D", 20)).toBeNull();
  });

  it("stops on release and steps again on the next press", () => {
    const r = new StepRepeater(100);
    r.update("R", 16);
    expect(r.update(null, 16)).toBeNull();
    expect(r.update(null, 500)).toBeNull();
    expect(r.update("R", 16)).toBe("R");
  });
});
