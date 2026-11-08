import { readdirSync, readFileSync } from "node:fs";
import { LevelParseError, parseLevel, replay } from "@sokoban/core";
import { describe, expect, it } from "vitest";
import { levelFromMarkdown, sortLevels } from "./content";

const folder = new URL("../../../../content/levels/", import.meta.url);
const files = readdirSync(folder).filter((name) => name.endsWith(".md"));
const read = (name: string) =>
  levelFromMarkdown(
    name.slice(0, -3),
    readFileSync(new URL(name, folder), "utf8"),
  );

// A known solution for each official level. They stay here rather than in the
// content, which players can read; this is the only copy of them.
const solutions: Record<string, string> = {
  "first-push": "rrRRR",
  "big-room": "rrDDDDDDDDDDDDDDDDldRRRRRRRRRRRRRRRRRRRRRRRRR",
  "two-boxes": "drrruullDldRuRurD",
  "hello-world": "rrrUdllURuRldldlluRRdrUdrU",
};

describe("content/levels", () => {
  it("are all playable, in order", () => {
    const levels = sortLevels(files.map(read));
    expect(levels.map((level) => level.id)).toEqual([
      "first-push",
      "big-room",
      "two-boxes",
      "hello-world",
    ]);
  });

  it.each(files)("%s replays its known solution", (name) => {
    const level = read(name);
    const solution = solutions[level.id];
    expect(solution, `no known solution for ${level.id}`).toBeDefined();
    expect(replay(parseLevel(level), solution ?? "").solved).toBe(true);
  });
});

describe("levelFromMarkdown", () => {
  const md = (front: string) => `---\n${front}\n---\n\nCredits.\n`;

  it("reads the front matter and ignores the body", () => {
    expect(
      levelFromMarkdown("a", md('title: A\norder: 2\nmap: ["#@$.#"]')),
    ).toEqual({ id: "a", title: "A", order: 2, map: ["#@$.#"] });
  });

  it.each([
    ["no front matter", "a", "title: A"],
    ["a bad slug", "Bad Slug", md('title: A\nmap: ["#@$.#"]')],
    ["no title", "a", md('map: ["#@$.#"]')],
    ["a non-integer order", "a", md('title: A\norder: 1.5\nmap: ["#@$.#"]')],
    ["two players", "a", md('title: A\nmap: ["#@@$.#"]')],
    [
      "a map over 50 rows",
      "a",
      md(`title: A\nmap: ${JSON.stringify(Array(51).fill("#@$.#"))}`),
    ],
  ])("rejects %s", (_, slug, text) => {
    expect(() => levelFromMarkdown(slug, text)).toThrow(LevelParseError);
  });
});

describe("sortLevels", () => {
  it("puts levels without an order last, by id", () => {
    const map = ["#@$.#"];
    const levels = sortLevels([
      { id: "b", title: "B", map },
      { id: "a", title: "A", map },
      { id: "c", title: "C", order: 1, map },
    ]);
    expect(levels.map((level) => level.id)).toEqual(["c", "a", "b"]);
  });
});
