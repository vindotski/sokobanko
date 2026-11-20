import { describe, expect, it } from "vitest";
import { pathCells, pathLine } from "./levelPath";

describe("pathCells", () => {
  it("snakes left to right, then right to left", () => {
    expect(pathCells(7, 3)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 1, col: 1 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ]);
  });

  it("keeps every level next to the one before it", () => {
    const cells = pathCells(40, 4);
    for (let i = 1; i < cells.length; i++) {
      const a = cells[i - 1];
      const b = cells[i];
      if (!a || !b) throw new Error("missing cell");
      expect(Math.abs(a.row - b.row) + Math.abs(a.col - b.col)).toBe(1);
    }
  });

  it("handles no levels", () => {
    expect(pathCells(0, 4)).toEqual([]);
  });
});

describe("pathLine", () => {
  it("joins the cells' centres", () => {
    expect(pathLine(pathCells(3, 2), 80, 56)).toBe("28,28 108,28 108,108");
  });
});
