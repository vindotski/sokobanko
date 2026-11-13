import { describe, expect, it } from "vitest";
import { parseLevel } from "./level.ts";
import {
  deadSquares,
  insideCells,
  isSolved,
  move,
  ReplayError,
  replay,
} from "./moves.ts";

const level = (...map: string[]) =>
  parseLevel({ id: "test", title: "Test", map });
const cell = (l: { width: number }, x: number, y: number) => y * l.width + x;

describe("move", () => {
  it("walks onto floor", () => {
    const l = level("#####", "#@ $.#", "#####");
    const result = move(l, "R");

    expect(result?.pushed).toBe(false);
    expect(result?.level.player).toBe(cell(l, 2, 1));
  });

  it("pushes a box", () => {
    const l = level("######", "#@$ .#", "######");
    const result = move(l, "R");

    expect(result?.pushed).toBe(true);
    expect(result?.level.player).toBe(cell(l, 2, 1));
    expect(result?.level.boxes[cell(l, 2, 1)]).toBe(0);
    expect(result?.level.boxes[cell(l, 3, 1)]).toBe(1);
  });

  it("walks onto a goal and pushes a box off one", () => {
    const l = level("#######", "#@.*  #", "#$    #", "#######");
    const onGoal = move(l, "R");
    expect(onGoal?.level.player).toBe(cell(l, 2, 1));

    const pushed = onGoal && move(onGoal.level, "R");
    expect(pushed?.pushed).toBe(true);
    expect(pushed?.level.boxes[cell(l, 4, 1)]).toBe(1);
  });

  it.each([
    ["a wall", ["####", "#@$.", "####"], "U"],
    ["a box against a wall", ["#####", "#@$#.", "#####"], "R"],
    ["two boxes in a row", ["######", "#@$$..", "######"], "R"],
    ["the map edge", ["@$."], "L"],
    ["a box at the map edge", ["#.@$"], "R"],
  ] as const)("is blocked by %s", (_, map, direction) => {
    expect(move(level(...map), direction)).toBeNull();
  });

  it("does not change the input level", () => {
    const l = level("######", "#@$ .#", "######");
    const boxes = l.boxes.slice();
    move(l, "R");

    expect(l.player).toBe(cell(l, 1, 1));
    expect(l.boxes).toEqual(boxes);
  });
});

describe("insideCells", () => {
  it("marks the floor inside the walls, including under boxes and goals", () => {
    const l = level(" #####", "##   #", "#@$$ #", "#  ..#", "######");
    const inside = insideCells(l);

    expect(inside.reduce((n, c) => n + c, 0)).toBe(11);
    expect(inside[cell(l, 2, 2)]).toBe(1); // box
    expect(inside[cell(l, 3, 3)]).toBe(1); // goal
  });

  it("leaves walls and the space outside them empty", () => {
    const l = level(" #####", "##   #", "#@$$ #", "#  ..#", "######");
    const inside = insideCells(l);

    expect(inside[cell(l, 0, 0)]).toBe(0); // outside, top-left
    expect(inside[cell(l, 1, 0)]).toBe(0); // wall
  });

  it("leaves padding outside a closed map empty", () => {
    // The short first row is padded with floor at (4, 0), outside the walls.
    const l = level("####", "#@$.#", "#####");
    const inside = insideCells(l);

    expect(inside.reduce((n, c) => n + c, 0)).toBe(3);
    expect(inside[cell(l, 4, 0)]).toBe(0);
  });
});

describe("isSolved", () => {
  it("is false while any box is off a goal", () => {
    expect(isSolved(level("#####", "#@$.#", "#####"))).toBe(false);
  });

  it("is true when every box is on a goal", () => {
    expect(isSolved(level("#####", "#@ *#", "#####"))).toBe(true);
  });
});

describe("replay", () => {
  const helloWorld = level(
    "##########",
    "####....##",
    "#  $$$$###",
    "#  @   ###",
    "##########",
  );

  it("solves 'Hello World!' with its reference solution", () => {
    const result = replay(helloWorld, "rUdrrUdlluRuRlddllluRRdrUdrU");

    expect(result.solved).toBe(true);
    expect(result.moves).toBe(28);
    expect(result.pushes).toBe(8);
    expect(result.solution).toBe("rUdrrUdlluRuRlddllluRRdrUdrU");
  });

  it("ignores input case and works out pushes from the board", () => {
    const result = replay(level("######", "#@ $.#", "######"), "RR");

    expect(result.solution).toBe("rR");
    expect(result.solved).toBe(true);
  });

  it("reports an unsolved board without failing", () => {
    const result = replay(helloWorld, "r");

    expect(result.solved).toBe(false);
    expect(result.moves).toBe(1);
  });

  it("returns the start state for an empty string", () => {
    const result = replay(helloWorld, "");

    expect(result.level).toBe(helloWorld);
    expect(result.moves).toBe(0);
  });

  it("rejects unknown letters", () => {
    expect(() => replay(helloWorld, "rx")).toThrow(ReplayError);
    expect(() => replay(helloWorld, "rx")).toThrow("unknown move 'x' at 1");
  });

  it("rejects blocked moves", () => {
    expect(() => replay(helloWorld, "dd")).toThrow("move 'd' at 0 is blocked");
  });
});

describe("deadSquares", () => {
  /** The dead squares drawn as a map: `x` dead, `.` live floor. */
  const deadMap = (...map: string[]) => {
    const l = level(...map);
    const dead = deadSquares(l);
    const inside = insideCells(l);
    return map.map((row, y) =>
      [...row]
        .map((glyph, x) => {
          const i = cell(l, x, y);
          if (glyph === "#") return "#";
          if (!inside[i]) return " ";
          return dead[i] ? "x" : ".";
        })
        .join(""),
    );
  };

  it("marks corners and walls with no goal along them", () => {
    expect(deadMap("######", "#@   #", "# $  #", "#   .#", "######")).toEqual([
      "######",
      "#xxxx#",
      "#x...#",
      "#x...#",
      "######",
    ]);
  });

  it("keeps a goal live, even in a corner", () => {
    expect(deadMap("#####", "#@$.#", "#####")).toEqual([
      "#####",
      "#x..#",
      "#####",
    ]);
  });

  it("marks both ends of a corridor without a goal there", () => {
    expect(deadMap("#######", "#@$. ##", "#######")).toEqual([
      "#######",
      "#x..x##",
      "#######",
    ]);
  });

  it("leaves floor outside the walls unmarked", () => {
    const l = level("  ####", "###@.#", "#  $ #", "######");
    const dead = deadSquares(l);
    expect(dead[cell(l, 0, 0)]).toBe(0);
    expect(dead[cell(l, 0, 1)]).toBe(0);
  });
});
