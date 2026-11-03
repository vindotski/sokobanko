import { describe, expect, it } from "vitest";
import {
  type Completion,
  completionsFrom,
  playerPath,
  toMarkdown,
  withBest,
} from "./progress";

const run = (level: string, moves: number, pushes = 2): Completion => ({
  level,
  moves,
  pushes,
  completedAt: "2026-11-04T10:00:00.000Z",
});

describe("playerPath", () => {
  it("is the player's file under progress/", () => {
    expect(playerPath("wl6PEdx1Df5FmwhhnBO6SaO4Z2rd4MbY")).toBe(
      "progress/wl6PEdx1Df5FmwhhnBO6SaO4Z2rd4MbY.md",
    );
  });

  it("refuses anything that isn't a Spotcraft id", () => {
    for (const id of ["", "../levels/first-push", "a b", "x".repeat(65)]) {
      expect(() => playerPath(id)).toThrow();
    }
  });
});

describe("withBest", () => {
  it("adds a first result", () => {
    const result = withBest([], run("first-push", 5));
    expect(result).toEqual({
      completions: [run("first-push", 5)],
      best: run("first-push", 5),
      improved: true,
    });
  });

  it("keeps the existing result for a longer run, or a tie", () => {
    for (const moves of [7, 5]) {
      const result = withBest([run("first-push", 5)], run("first-push", moves));
      expect(result.improved).toBe(false);
      expect(result.best.moves).toBe(5);
      expect(result.completions).toEqual([run("first-push", 5)]);
    }
  });

  it("replaces it with a shorter run, leaving other levels alone", () => {
    const result = withBest(
      [run("big-room", 45), run("first-push", 5)],
      run("first-push", 3),
    );
    expect(result.improved).toBe(true);
    expect(result.best.moves).toBe(3);
    expect(result.completions).toEqual([
      run("big-room", 45),
      run("first-push", 3),
    ]);
  });
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

describe("toMarkdown", () => {
  it("writes front matter only, levels in alphabetical order", () => {
    expect(toMarkdown([run("first-push", 3), run("big-room", 45, 15)])).toBe(
      [
        "---",
        "completions:",
        "  - level: big-room",
        "    moves: 45",
        "    pushes: 15",
        '    completedAt: "2026-11-04T10:00:00.000Z"',
        "  - level: first-push",
        "    moves: 3",
        "    pushes: 2",
        '    completedAt: "2026-11-04T10:00:00.000Z"',
        "---",
        "",
      ].join("\n"),
    );
  });

  it("writes an empty list as []", () => {
    expect(toMarkdown([])).toBe("---\ncompletions: []\n---\n");
  });
});
