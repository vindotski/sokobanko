import {
  type Direction,
  directionToLetter,
  letterToDirection,
} from "./direction.ts";
import type { ParsedLevel } from "./level.ts";

const OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  U: { dx: 0, dy: -1 },
  D: { dx: 0, dy: 1 },
  L: { dx: -1, dy: 0 },
  R: { dx: 1, dy: 0 },
};

/** The cell next to `cell` in `direction`, or `null` past the map edge. */
function neighbor(level: ParsedLevel, cell: number, direction: Direction) {
  const { dx, dy } = OFFSETS[direction];
  const x = (cell % level.width) + dx;
  const y = Math.floor(cell / level.width) + dy;
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return null;
  return y * level.width + x;
}

/**
 * Marks the floor inside the walls: every cell the player could ever walk to,
 * treating boxes as passable. Cells outside the walls stay 0, so renderers can
 * leave them empty.
 */
export function insideCells(level: ParsedLevel): Uint8Array {
  const inside = new Uint8Array(level.walls.length);
  const queue = [level.player];
  inside[level.player] = 1;

  for (let cell = queue.pop(); cell !== undefined; cell = queue.pop()) {
    for (const direction of ["U", "D", "L", "R"] as const) {
      const next = neighbor(level, cell, direction);
      if (next === null || inside[next] || level.walls[next]) continue;
      inside[next] = 1;
      queue.push(next);
    }
  }
  return inside;
}

/**
 * Marks the dead squares: floor inside the walls from which a box can never
 * be pushed onto any goal, such as corners and walls with no goal along
 * them. Works back from every goal, pulling a box wherever the player would
 * have room to stand behind it, and ignores other boxes and whether the
 * player can get there, so a square marked dead is always dead.
 */
export function deadSquares(level: ParsedLevel): Uint8Array {
  const inside = insideCells(level);
  const live = new Uint8Array(level.walls.length);
  const queue: number[] = [];
  for (let i = 0; i < level.goals.length; i++) {
    if (level.goals[i] && inside[i]) {
      live[i] = 1;
      queue.push(i);
    }
  }
  const floor = (cell: number | null): cell is number =>
    cell !== null && inside[cell] === 1 && !level.walls[cell];

  for (let cell = queue.pop(); cell !== undefined; cell = queue.pop()) {
    for (const direction of ["U", "D", "L", "R"] as const) {
      // The box came from `from`, pushed by a player standing one further.
      const from = neighbor(level, cell, direction);
      if (!floor(from) || live[from]) continue;
      if (!floor(neighbor(level, from, direction))) continue;
      live[from] = 1;
      queue.push(from);
    }
  }

  const dead = new Uint8Array(level.walls.length);
  for (let i = 0; i < dead.length; i++) {
    if (inside[i] && !level.walls[i] && !live[i]) dead[i] = 1;
  }
  return dead;
}

export interface MoveResult {
  level: ParsedLevel;
  pushed: boolean;
}

/**
 * Steps the player one cell, pushing a box if there is one. Returns `null`
 * when blocked by a wall, the map edge, or a box that cannot move. Never
 * mutates `level`; the result shares its `walls` and `goals` arrays.
 */
export function move(
  level: ParsedLevel,
  direction: Direction,
): MoveResult | null {
  const target = neighbor(level, level.player, direction);
  if (target === null || level.walls[target]) return null;
  if (!level.boxes[target]) {
    return { level: { ...level, player: target }, pushed: false };
  }

  const beyond = neighbor(level, target, direction);
  if (beyond === null || level.walls[beyond] || level.boxes[beyond]) {
    return null;
  }
  const boxes = level.boxes.slice();
  boxes[target] = 0;
  boxes[beyond] = 1;
  return { level: { ...level, boxes, player: target }, pushed: true };
}

/** True when every box is on a goal. */
export function isSolved(level: ParsedLevel): boolean {
  return level.boxes.every((box, i) => !box || level.goals[i] === 1);
}

// Fields are declared rather than parameter properties, so plain Node can run
// this file (bin/ scripts).
export class ReplayError extends Error {
  /** Zero-based position of the offending letter. */
  readonly index: number;

  constructor(index: number, message: string) {
    super(message);
    this.name = "ReplayError";
    this.index = index;
  }
}

export interface ReplayResult {
  level: ParsedLevel;
  moves: number;
  pushes: number;
  solved: boolean;
  /** The input normalised to lowercase walks and uppercase pushes. */
  solution: string;
}

/**
 * Plays a LURD move string from `level`. Letter case is ignored on input;
 * pushes are worked out from the board. Throws `ReplayError` on an unknown
 * letter or a blocked move.
 */
export function replay(level: ParsedLevel, solution: string): ReplayResult {
  let current = level;
  let pushes = 0;
  let normalised = "";

  for (const [i, letter] of [...solution].entries()) {
    const direction = letterToDirection(letter);
    if (!direction)
      throw new ReplayError(i, `unknown move '${letter}' at ${i}`);

    const result = move(current, direction);
    if (!result)
      throw new ReplayError(i, `move '${letter}' at ${i} is blocked`);

    current = result.level;
    if (result.pushed) pushes++;
    normalised += directionToLetter(direction, result.pushed);
  }

  return {
    level: current,
    moves: normalised.length,
    pushes,
    solved: isSolved(current),
    solution: normalised,
  };
}
