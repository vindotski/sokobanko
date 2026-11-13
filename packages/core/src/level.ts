/**
 * A level as stored on disk. `map` rows use the classic Sokoban (XSB) glyphs:
 *
 *   `#` wall
 *   `.` goal
 *   `$` box
 *   `@` player
 *   `*` box on goal
 *   `+` player on goal
 *   ` ` floor
 *
 * Rows may have different lengths; short rows are padded with floor.
 */
export interface LevelJson {
  id: string;
  title: string;
  map: string[];
  /** LURD moves; uppercase letters are pushes. */
  solution?: string;
}

/**
 * A level flattened into row-major cell arrays, where cell `i` is at
 * `x = i % width`, `y = Math.floor(i / width)`. Each array holds 1 where the
 * cell has that feature and 0 elsewhere.
 */
export interface ParsedLevel {
  width: number;
  height: number;
  walls: Uint8Array;
  goals: Uint8Array;
  boxes: Uint8Array;
  /** Cell index of the player. */
  player: number;
}

export class LevelParseError extends Error {
  // A declared field rather than a parameter property, so plain Node can run
  // this file (bin/ scripts).
  readonly levelId: string;

  constructor(levelId: string, message: string) {
    super(`Level '${levelId}': ${message}`);
    this.name = "LevelParseError";
    this.levelId = levelId;
  }
}

export function parseLevel(level: LevelJson): ParsedLevel {
  const fail = (message: string) => new LevelParseError(level.id, message);

  const height = level.map.length;
  const width = Math.max(0, ...level.map.map((row) => row.length));
  if (width === 0) throw fail("map is empty");

  const walls = new Uint8Array(width * height);
  const goals = new Uint8Array(width * height);
  const boxes = new Uint8Array(width * height);
  let player = -1;
  let boxCount = 0;
  let goalCount = 0;

  level.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const i = y * width + x;
      switch (ch) {
        case " ":
          break;
        case "#":
          walls[i] = 1;
          break;
        case ".":
          goals[i] = 1;
          goalCount++;
          break;
        case "$":
          boxes[i] = 1;
          boxCount++;
          break;
        case "*":
          goals[i] = 1;
          boxes[i] = 1;
          goalCount++;
          boxCount++;
          break;
        case "@":
        case "+":
          if (player >= 0) throw fail(`extra player at (${x}, ${y})`);
          player = i;
          if (ch === "+") {
            goals[i] = 1;
            goalCount++;
          }
          break;
        default:
          throw fail(`unknown glyph '${ch}' at (${x}, ${y})`);
      }
    }
  });

  if (player < 0) throw fail("no player ('@' or '+')");
  if (boxCount === 0) throw fail("no boxes");
  if (boxCount !== goalCount) {
    throw fail(`${boxCount} boxes but ${goalCount} goals`);
  }

  return { width, height, walls, goals, boxes, player };
}
