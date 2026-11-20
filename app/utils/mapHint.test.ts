import { levelStates } from "@sokobanko/core";
import { describe, expect, it } from "vitest";
import {
  hintFromStates,
  parseColumns,
  parseHint,
  serializeHint,
  statesFromHint,
} from "./mapHint";

const levels = [
  { id: "a-1", collection: "a" },
  { id: "a-2", collection: "a" },
  { id: "a-3", collection: "a" },
  { id: "b-1", collection: "b" },
  { id: "b-2", collection: "b" },
];

function states(solved: string[]) {
  return levelStates(levels, (id) => solved.includes(id));
}

describe("map hint", () => {
  it("names each collection's level up next, or none once it's all solved", () => {
    expect(hintFromStates(levels, states(["a-1", "b-1", "b-2"]))).toEqual({
      a: "a-2",
      b: null,
    });
    expect(hintFromStates(levels, Object.fromEntries(states([])))).toEqual({
      a: "a-1",
      b: "b-1",
    });
  });

  it("gives back the same states when the solved levels come in order", () => {
    for (const solved of [
      [],
      ["a-1"],
      ["a-1", "a-2", "b-1"],
      levels.map((l) => l.id),
    ]) {
      const hint = parseHint(
        serializeHint(hintFromStates(levels, states(solved))),
      );
      expect(statesFromHint(levels, hint ?? {})).toEqual(states(solved));
    }
  });

  it("serializes compactly", () => {
    expect(serializeHint({ a: "a-2", b: null })).toBe("a:a-2|b:*");
  });

  it("skips what it can't read", () => {
    expect(parseHint("a:a-2|b:*")).toEqual({ a: "a-2", b: null });
    expect(parseHint("a:a-2|<b>:*|c:|d:x:y|e:E!")).toEqual({ a: "a-2" });
    expect(parseHint("")).toBeUndefined();
    expect(parseHint(42)).toBeUndefined();
    expect(parseHint(undefined)).toBeUndefined();
    expect(parseHint("a:a-1|".repeat(200))).toBeUndefined();
  });

  it("treats unknown levels and collections as unsolved", () => {
    expect(statesFromHint(levels, { a: "gone", zz: null })).toEqual(states([]));
    // A level up next from another collection doesn't count either.
    expect(statesFromHint(levels, { a: "b-2" })).toEqual(states([]));
  });

  it("reads only column counts the map uses", () => {
    expect(parseColumns("7")).toBe(7);
    expect(parseColumns(10)).toBe(10);
    for (const bad of ["3", "11", "4.5", "x", undefined, null]) {
      expect(parseColumns(bad)).toBeUndefined();
    }
  });
});
