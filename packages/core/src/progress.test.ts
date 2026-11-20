import { describe, expect, it } from "vitest";
import { isBetter, levelStates, pendingUploads } from "./progress.ts";

/** Levels as `collection/id`, in play order; the state of each, by id. */
const states = (levels: string[], solved: string[]) =>
  Object.fromEntries(
    levelStates(
      levels.map((level) => {
        const [collection, id] = level.includes("/")
          ? level.split("/")
          : ["one", level];
        return { id: id ?? level, collection: collection ?? "one" };
      }),
      (id) => solved.includes(id),
    ),
  );

describe("levelStates", () => {
  it("makes the first level current when nothing is solved", () => {
    expect(states(["a", "b", "c"], [])).toEqual({
      a: "current",
      b: "locked",
      c: "locked",
    });
  });

  it("makes the level after the solved ones current", () => {
    expect(states(["a", "b", "c"], ["a"])).toEqual({
      a: "solved",
      b: "current",
      c: "locked",
    });
  });

  it("has no current level when everything is solved", () => {
    expect(states(["a", "b"], ["a", "b"])).toEqual({
      a: "solved",
      b: "solved",
    });
  });

  it("keeps solved levels playable after an unsolved one", () => {
    // "b" was added between levels the player had already solved.
    expect(states(["a", "b", "c", "d"], ["a", "c"])).toEqual({
      a: "solved",
      b: "current",
      c: "solved",
      d: "locked",
    });
  });

  it("makes each collection's first level current", () => {
    expect(states(["x/a", "x/b", "y/c", "y/d"], [])).toEqual({
      a: "current",
      b: "locked",
      c: "current",
      d: "locked",
    });
  });

  it("never locks one collection behind another", () => {
    // "x" isn't finished, and "y" goes on from where the player is.
    expect(states(["x/a", "x/b", "y/c", "y/d", "y/e"], ["a", "c"])).toEqual({
      a: "solved",
      b: "current",
      c: "solved",
      d: "current",
      e: "locked",
    });
  });

  it("keeps a later level current within its own collection", () => {
    // "b" was added to "x" between solved levels; "y" is unaffected.
    expect(states(["x/a", "x/b", "x/c", "y/d"], ["a", "c", "d"])).toEqual({
      a: "solved",
      b: "current",
      c: "solved",
      d: "solved",
    });
  });

  it("handles no levels", () => {
    expect(states([], [])).toEqual({});
  });
});

describe("isBetter", () => {
  it("prefers fewer moves, then fewer pushes", () => {
    expect(isBetter({ moves: 9, pushes: 5 }, { moves: 10, pushes: 1 })).toBe(
      true,
    );
    expect(isBetter({ moves: 10, pushes: 2 }, { moves: 10, pushes: 3 })).toBe(
      true,
    );
    expect(isBetter({ moves: 10, pushes: 3 }, { moves: 10, pushes: 3 })).toBe(
      false,
    );
    expect(isBetter({ moves: 11, pushes: 0 }, { moves: 10, pushes: 3 })).toBe(
      false,
    );
  });

  it("beats no result", () => {
    expect(isBetter({ moves: 10, pushes: 3 }, undefined)).toBe(true);
  });
});

describe("pendingUploads", () => {
  const levels = [
    { id: "a", collection: "one" },
    { id: "b", collection: "one" },
    { id: "x", collection: "two" },
    { id: "c", collection: "one" },
  ];

  it("lists local results the server lacks or has worse, in play order", () => {
    const local = {
      c: { moves: 5, pushes: 1 },
      a: { moves: 5, pushes: 1 },
      b: { moves: 5, pushes: 1 },
      x: { moves: 5, pushes: 1 },
    };
    const server = {
      a: { moves: 5, pushes: 1 },
      b: { moves: 6, pushes: 1 },
    };
    expect(pendingUploads(levels, local, server)).toEqual(["b", "x", "c"]);
  });

  it("skips levels that aren't published", () => {
    expect(
      pendingUploads(levels, { gone: { moves: 1, pushes: 1 } }, {}),
    ).toEqual([]);
  });
});
