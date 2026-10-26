import { describe, expect, it } from "vitest";
import { levelStates } from "./progress.ts";

const states = (ids: string[], solved: string[]) =>
  Object.fromEntries(levelStates(ids, (id) => solved.includes(id)));

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

  it("handles no levels", () => {
    expect(states([], [])).toEqual({});
  });
});
