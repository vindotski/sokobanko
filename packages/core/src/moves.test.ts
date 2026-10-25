import { describe, expect, it } from "vitest";
import { parseLevel } from "./level.ts";
import { isSolved, move, ReplayError, replay } from "./moves.ts";

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
