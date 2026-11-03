import { parseLevel, replay } from "@sokoban/core";
import { describe, expect, it } from "vitest";
import { type ContentItem, levelsFromItems } from "./levels";

const item = (slug: string, data: Record<string, unknown>): ContentItem => ({
  path: `levels/${slug}`,
  data,
  updatedAt: "2026-11-03T00:00:00.000Z",
});

// The official levels, shaped as the API lists them, with a known solution
// each. Solutions stay here rather than in the content, which is public.
const official = [
  {
    item: item("first-push", {
      title: "First Push",
      order: 1,
      map: ["#######", "#@ $ .#", "#######"],
    }),
    solution: "rRR",
  },
  {
    item: item("big-room", {
      title: "Big Room",
      order: 2,
      map: [
        "##############################",
        "#@                           #",
        "#  $                         #",
        ...Array<string>(15).fill("#                            #"),
        "#                           .#",
        "##############################",
      ],
    }),
    solution: "rrDDDDDDDDDDDDDDDDldRRRRRRRRRRRRRRRRRRRRRRRRR",
  },
  {
    item: item("two-boxes", {
      title: "Two Boxes",
      order: 3,
      map: [" #####", "##   #", "#@$$ #", "#  ..#", "######"],
    }),
    solution: "drrruullDldRuRurD",
  },
  {
    item: item("hello-world", {
      title: "Hello World!",
      order: 4,
      map: [
        "##########",
        "####....##",
        "#  $$$$###",
        "#  @   ###",
        "##########",
      ],
    }),
    solution: "rrrUdllURuRldldlluRRdrUdrU",
  },
];

describe("levelsFromItems", () => {
  it("takes the slug from the path and sorts by order", () => {
    const shuffled = [...official].reverse().map((o) => o.item);
    expect(levelsFromItems(shuffled).map((l) => l.id)).toEqual([
      "first-push",
      "big-room",
      "two-boxes",
      "hello-world",
    ]);
  });

  it.each(official)(
    "$item.path replays its known solution",
    ({ item, solution }) => {
      const [level] = levelsFromItems([item]);
      expect(level).toBeDefined();
      if (level) expect(replay(parseLevel(level), solution).solved).toBe(true);
    },
  );

  it("puts levels without an order last, by id", () => {
    const map = ["#@$.#"];
    const levels = levelsFromItems([
      item("b", { title: "B", map }),
      item("a", { title: "A", map }),
      item("c", { title: "C", order: 1, map }),
    ]);
    expect(levels.map((l) => l.id)).toEqual(["c", "a", "b"]);
  });

  it("skips maps parseLevel rejects", () => {
    const levels = levelsFromItems([
      item("two-players", { title: "Two", map: ["#@@$.#"] }),
      item("ok", { title: "Ok", map: ["#@$.#"] }),
    ]);
    expect(levels.map((l) => l.id)).toEqual(["ok"]);
  });
});
