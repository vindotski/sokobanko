/**
 * Finds a solution for every level that doesn't have one yet, so the tests
 * can replay each official level. Reads the levels as JSON on stdin (the
 * running app's /api/levels) and updates the solutions file in place:
 *
 *   curl -s localhost:3000/api/levels | node bin/solve-levels.ts apps/web/server/utils/solutions.json
 *
 * Solutions needn't be short. Each level is searched best-first over box
 * positions, one push at a time: forwards from the start, and if that runs
 * out of room, backwards from the solved position, pulling boxes back to where
 * they start. Backwards is better at goals that must be filled in order (a
 * dead-end row of goals fills from the far end, which in reverse is simply
 * emptying it from the near end). Every solution is checked with the game's
 * own replay. MAX_STATES (default 3,000,000) bounds each search, and
 * DIRECTION=forwards or backwards runs only one of them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  type LevelJson,
  type ParsedLevel,
  parseLevel,
  replay,
} from "../packages/core/src/index.ts";

const MAX_STATES = Math.min(
  Number(process.env.MAX_STATES ?? 3_000_000),
  // A Set can't hold more.
  16_000_000,
);
const only = process.env.DIRECTION;
const [file] = process.argv.slice(2);
if (!file) {
  console.error("usage: … | node bin/solve-levels.ts <solutions.json>");
  process.exit(1);
}

let solutions: Record<string, string> = {};
try {
  solutions = JSON.parse(readFileSync(file, "utf8"));
} catch {}
const levels: LevelJson[] = JSON.parse(readFileSync(0, "utf8"));

for (const level of levels) {
  if (solutions[level.id]) continue;
  const started = performance.now();
  const parsed = parseLevel(level);
  const solution =
    (only !== "backwards" ? solve(parsed, "forwards") : undefined) ??
    (only !== "forwards" ? solve(parsed, "backwards") : undefined);
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  if (solution && replay(parseLevel(level), solution).solved) {
    solutions[level.id] = solution;
    console.info(`${level.id}: ${solution.length} moves, ${seconds} s`);
  } else {
    console.warn(`${level.id}: not solved (${seconds} s)`);
  }
}

// In play order, then any kept for levels that weren't given.
const order = new Map(levels.map((l, i) => [l.id, i]));
const sorted = Object.fromEntries(
  Object.entries(solutions).sort(
    ([a], [b]) =>
      (order.get(a) ?? Number.POSITIVE_INFINITY) -
        (order.get(b) ?? Number.POSITIVE_INFINITY) || a.localeCompare(b),
  ),
);
writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);

interface Node {
  /** Box cells, sorted. */
  boxes: number[];
  player: number;
  parent?: Node;
  /** Where the player stood for this push or pull, and the step's index. */
  step?: [number, number];
}

function solve(
  level: ParsedLevel,
  direction: "forwards" | "backwards",
): string | undefined {
  const { width, walls, goals } = level;
  const size = walls.length;
  const steps = [
    [-1, "l"],
    [-width, "u"],
    [1, "r"],
    [width, "d"],
  ] as const;
  const INFINITY = Number.POSITIVE_INFINITY;
  const open = (i: number) => i >= 0 && i < size && !walls[i];
  const cellsOf = (flags: Uint8Array) =>
    [...flags.keys()].filter((i) => flags[i]);
  const startBoxes = cellsOf(level.boxes);
  const goalCells = cellsOf(goals);
  const backwards = direction === "backwards";
  // Forwards, boxes travel to the goals; backwards, to where they start.
  const targets = backwards ? startBoxes : goalCells;

  // Pushes needed to bring a box from each cell to each target, ignoring the
  // other boxes. Infinite means never: such cells are dead for boxes.
  const toTarget = targets.map((target) => {
    const cost = new Float64Array(size).fill(INFINITY);
    cost[target] = 0;
    const queue = [target];
    while (queue.length) {
      const cell = queue.shift() as number;
      for (const [d] of steps) {
        // Forwards a box reaches `cell` from `cell + d`, pushed by a player
        // at `cell + 2d`; backwards it's pulled from `cell - d` by a player
        // at `cell`, who steps back to `cell + d`.
        const from = backwards ? cell - d : cell + d;
        const behind = backwards ? cell + d : cell + 2 * d;
        if (open(from) && open(behind) && cost[from] === INFINITY) {
          cost[from] = (cost[cell] as number) + 1;
          queue.push(from);
        }
      }
    }
    return cost;
  });
  const live = new Uint8Array(size);
  for (const cost of toTarget)
    cost.forEach((c, i) => {
      if (c < INFINITY) live[i] = 1;
    });

  // An estimate of the steps left: each target gets its own box, matched
  // greedily from the closest pairs.
  const score = (boxes: number[]) => {
    const pairs: [number, number, number][] = [];
    boxes.forEach((box, b) => {
      toTarget.forEach((cost, t) => {
        pairs.push([cost[box] as number, b, t]);
      });
    });
    pairs.sort((x, y) => x[0] - y[0]);
    const boxUsed = new Uint8Array(boxes.length);
    const targetUsed = new Uint8Array(targets.length);
    let total = 0;
    let left = boxes.length;
    for (const [cost, b, t] of pairs) {
      if (boxUsed[b] || targetUsed[t]) continue;
      boxUsed[b] = 1;
      targetUsed[t] = 1;
      total += Math.min(cost, 1000);
      if (--left === 0) break;
    }
    return total;
  };

  // Cells the player can reach without moving a box; the smallest one names
  // the region, so states that differ only in where the player stands merge.
  const reach = (boxes: Set<number>, from: number) => {
    const seen = new Set([from]);
    const stack = [from];
    while (stack.length) {
      const cell = stack.pop() as number;
      for (const [d] of steps) {
        const to = cell + d;
        if (open(to) && !boxes.has(to) && !seen.has(to)) {
          seen.add(to);
          stack.push(to);
        }
      }
    }
    return seen;
  };
  const walk = (boxes: Set<number>, from: number, to: number) => {
    const came = new Map<number, [number, string]>([[from, [-1, ""]]]);
    const queue = [from];
    while (queue.length) {
      const cell = queue.shift() as number;
      if (cell === to) break;
      for (const [d, letter] of steps) {
        const next = cell + d;
        if (open(next) && !boxes.has(next) && !came.has(next)) {
          came.set(next, [cell, letter]);
          queue.push(next);
        }
      }
    }
    let path = "";
    for (let cell = to; cell !== from; ) {
      const [previous, letter] = came.get(cell) as [number, string];
      path = letter + path;
      cell = previous;
    }
    return path;
  };
  // Forwards only: two boxes side by side against a wall, or four in a
  // square, can never be pushed again.
  const frozen = (boxes: Set<number>, box: number) => {
    const blocked = (i: number) => walls[i] === 1 || boxes.has(i);
    for (const [a, b] of [
      [-1, -width],
      [-width, 1],
      [1, width],
      [width, -1],
    ] as const) {
      if (
        blocked(box + a) &&
        blocked(box + b) &&
        blocked(box + a + b) &&
        [box, box + a, box + b, box + a + b].some(
          (i) => boxes.has(i) && !goals[i],
        )
      ) {
        return true;
      }
    }
    return false;
  };
  const keyOf = (boxes: number[], player: number) =>
    `${Math.min(...reach(new Set(boxes), player))}:${boxes.join(",")}`;

  // Buckets by score: a simple priority queue for small integer scores.
  const buckets: Node[][] = [];
  const add = (node: Node) => {
    const s = score(node.boxes);
    const bucket = buckets[s] ?? [];
    buckets[s] = bucket;
    bucket.push(node);
  };
  const seen = new Set<string>();
  const startNodes: Node[] = [];
  if (backwards) {
    // Solved: every box on a goal, the player in any region it could be in.
    const placed = new Set(goalCells);
    const covered = new Set<number>();
    for (let cell = 0; cell < size; cell++) {
      if (!open(cell) || placed.has(cell) || covered.has(cell)) continue;
      for (const c of reach(placed, cell)) covered.add(c);
      startNodes.push({ boxes: goalCells, player: cell });
    }
  } else {
    startNodes.push({ boxes: startBoxes, player: level.player });
  }
  for (const node of startNodes) {
    seen.add(keyOf(node.boxes, node.player));
    add(node);
  }
  const startKey = startBoxes.join(",");
  const done = (boxes: number[], player: number) =>
    backwards
      ? boxes.join(",") === startKey &&
        reach(new Set(boxes), player).has(level.player)
      : boxes.every((b) => goals[b]);

  let found: Node | undefined;
  search: while (seen.size < MAX_STATES) {
    const bucket = buckets.find((b) => b?.length);
    if (!bucket) break;
    const node = bucket.pop() as Node;
    const boxes = new Set(node.boxes);
    const reachable = reach(boxes, node.player);
    for (const box of node.boxes) {
      for (const [index, [d]] of steps.entries()) {
        // Forwards: the player at box - d pushes it to box + d. Backwards:
        // the player at box + d pulls it there, stepping back to box + 2d.
        const stand = backwards ? box + d : box - d;
        const to = box + d;
        const playerTo = backwards ? box + 2 * d : box;
        if (!reachable.has(stand) || !live[to]) continue;
        if (backwards ? !open(playerTo) || boxes.has(playerTo) : boxes.has(to))
          continue;
        const next = new Set(boxes);
        next.delete(box);
        next.add(to);
        if (!backwards && frozen(next, to)) continue;
        const sorted = [...next].sort((a, b) => a - b);
        const key = keyOf(sorted, playerTo);
        if (seen.has(key)) continue;
        seen.add(key);
        const child: Node = {
          boxes: sorted,
          player: playerTo,
          parent: node,
          step: [stand, index],
        };
        if (done(sorted, playerTo)) {
          found = child;
          break search;
        }
        add(child);
      }
    }
  }
  if (!found) return undefined;

  const chain: Node[] = [];
  for (let n: Node | undefined = found; n; n = n.parent) chain.unshift(n);
  let lurd = "";
  if (!backwards) {
    for (let i = 1; i < chain.length; i++) {
      const before = chain[i - 1] as Node;
      const [stand, index] = (chain[i] as Node).step as [number, number];
      lurd += walk(new Set(before.boxes), before.player, stand);
      lurd += (steps[index] as (typeof steps)[number])[1].toUpperCase();
    }
    return lurd;
  }
  // Backwards, the chain runs from solved to the start. Played the other
  // way, each pull is a push: the player, where the pull left it, pushes the
  // box back the opposite way, ending where the pull began.
  let player = level.player;
  for (let i = chain.length - 1; i > 0; i--) {
    const after = chain[i] as Node;
    const [stand, index] = after.step as [number, number];
    lurd += walk(new Set(after.boxes), player, after.player);
    lurd += (steps[(index + 2) % 4] as (typeof steps)[number])[1].toUpperCase();
    player = stand;
  }
  return lurd;
}
