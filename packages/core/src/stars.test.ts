import { describe, expect, it } from "vitest";
import { starsFor, twoStarLimit } from "./stars.ts";

describe("starsFor", () => {
  it("gives three stars at par or under", () => {
    expect(starsFor(20, 20)).toBe(3);
    expect(starsFor(18, 20)).toBe(3);
  });

  it("gives two stars up to a quarter over par", () => {
    expect(starsFor(21, 20)).toBe(2);
    expect(starsFor(25, 20)).toBe(2);
  });

  it("gives one star beyond that", () => {
    expect(starsFor(26, 20)).toBe(1);
    expect(starsFor(1000, 20)).toBe(1);
  });

  it("rounds the two-star limit down", () => {
    // 5 × 1.25 = 6.25: six moves earn two stars, seven don't.
    expect(twoStarLimit(5)).toBe(6);
    expect(starsFor(6, 5)).toBe(2);
    expect(starsFor(7, 5)).toBe(1);
  });
});
