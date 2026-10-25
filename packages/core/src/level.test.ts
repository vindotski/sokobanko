import { describe, expect, it } from "vitest";
import { LevelParseError, parseLevel } from "./level.ts";

const level = (...map: string[]) => ({ id: "test", title: "Test", map });

describe("parseLevel", () => {
  it("parses every glyph", () => {
    const p = parseLevel(level("#####", "#.$$#", "# *+#", "#####"));
    const at = (x: number, y: number) => y * p.width + x;

    expect(p.width).toBe(5);
    expect(p.height).toBe(4);
    expect(p.walls[at(0, 0)]).toBe(1);
    expect(p.walls[at(2, 2)]).toBe(0);
    expect(p.goals[at(1, 1)]).toBe(1);
    expect(p.boxes[at(2, 1)]).toBe(1);
    expect(p.goals[at(2, 1)]).toBe(0);
    expect(p.boxes[at(2, 2)]).toBe(1);
    expect(p.goals[at(2, 2)]).toBe(1);
    expect(p.player).toBe(at(3, 2));
    expect(p.goals[at(3, 2)]).toBe(1);
  });

  it("uses the longest row as width and pads short rows with floor", () => {
    const p = parseLevel(level("######", "#@$.#", "####"));

    expect(p.width).toBe(6);
    expect(p.height).toBe(3);
    expect(p.walls).toHaveLength(18);
    expect(p.walls[1 * 6 + 5]).toBe(0);
    expect(p.walls[2 * 6 + 4]).toBe(0);
  });

  it("parses the reference level 'Hello World!'", () => {
    const p = parseLevel(
      level(
        "##########",
        "####....##",
        "#  $$$$###",
        "#  @   ###",
        "##########",
      ),
    );

    expect(p.player).toBe(3 * 10 + 3);
    expect(p.boxes.reduce((n, b) => n + b, 0)).toBe(4);
    expect(p.goals.reduce((n, g) => n + g, 0)).toBe(4);
  });

  it.each([
    ["an empty map", [], /map is empty/],
    ["no player", ["#####", "#$. #", "#####"], /no player/],
    ["two players", ["#####", "#@$.@#", "#####"], /extra player at \(4, 1\)/],
    ["an unknown glyph", ["#####", "#@$.x#", "#####"], /unknown glyph 'x'/],
    ["no boxes", ["####", "#@ #", "####"], /no boxes/],
    ["box/goal mismatch", ["#####", "#@$$.#", "#####"], /2 boxes but 1 goals/],
  ])("rejects %s", (_, map, message) => {
    expect(() => parseLevel(level(...map))).toThrow(LevelParseError);
    expect(() => parseLevel(level(...map))).toThrow(message);
  });

  it("includes the level id in errors", () => {
    expect(() =>
      parseLevel({ id: "world1-007", title: "x", map: ["#"] }),
    ).toThrow(/^Level 'world1-007': /);
  });
});
