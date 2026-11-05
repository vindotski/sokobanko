import { describe, expect, it } from "vitest";
import { type Completion, completionsFrom } from "./progress";

const run = (level: string, moves: number, pushes = 2): Completion => ({
  level,
  moves,
  pushes,
  completedAt: "2026-11-04T10:00:00.000Z",
});

describe("completionsFrom", () => {
  it("reads the front matter's completions", () => {
    expect(completionsFrom({ completions: [run("first-push", 3)] })).toEqual([
      run("first-push", 3),
    ]);
  });

  it("is empty for a missing or odd file", () => {
    for (const data of [null, undefined, {}, { completions: "no" }]) {
      expect(completionsFrom(data)).toEqual([]);
    }
  });

  it("drops malformed entries", () => {
    const data = {
      completions: [
        run("first-push", 3),
        { ...run("big-room", 45), moves: 0 },
        { ...run("two-boxes", 17), level: "Two Boxes" },
        { ...run("hello-world", 26), completedAt: "yesterday" },
        null,
      ],
    };
    expect(completionsFrom(data)).toEqual([run("first-push", 3)]);
  });
});
