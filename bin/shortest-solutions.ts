/**
 * Replaces each level's solution with one of the fewest moves, where it can
 * find one. A level's par is the length of its solution, so this is what
 * makes par mean "the fewest moves possible". Reads the levels as JSON on
 * stdin (the running app's /api/levels) and updates the solutions file in
 * place:
 *
 *   curl -s localhost:3000/api/levels | node bin/shortest-solutions.ts apps/web/server/utils/solutions.json
 *
 * Each level is searched with A* over single moves (not pushes, as in
 * bin/solve-levels.ts), so the first solution found has the fewest moves. The
 * estimate of the moves left is the sum, over boxes, of the fewest pushes
 * from its cell to any goal: every push is a move, so it never overestimates.
 * MAX_STATES (default 12,000,000) bounds each search; a level that runs out
 * keeps its solution, and par is then the fewest moves known, not proven.
 * ONLY=microban-093,microban-099 searches just those levels.
 *
 * WEIGHT=2 (default 1) trusts the estimate more: the search gets much faster,
 * and finds a solution at most that many times the fewest moves, but no
 * longer proves it fewest. For levels the exact search can't finish, it
 * still makes par tighter than bin/solve-levels.ts's first solution.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  type LevelJson,
  type ParsedLevel,
  parseLevel,
  replay,
} from "../packages/core/src/index.ts";

const MAX_STATES = Number(process.env.MAX_STATES ?? 12_000_000);
const only = process.env.ONLY?.split(",");
const WEIGHT = Number(process.env.WEIGHT ?? 1);
const proven = WEIGHT === 1 ? "fewest" : `within ${WEIGHT}× fewest`;
const [file] = process.argv.slice(2);
if (!file) {
  console.error("usage: … | node bin/shortest-solutions.ts <solutions.json>");
  process.exit(1);
}

const solutions: Record<string, string> = JSON.parse(
  readFileSync(file, "utf8"),
);
const levels: LevelJson[] = JSON.parse(readFileSync(0, "utf8"));

for (const level of levels) {
  if (only && !only.includes(level.id)) continue;
  const known = solutions[level.id];
  const started = performance.now();
  const shortest = search(parseLevel(level));
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  if (!shortest || !replay(parseLevel(level), shortest).solved) {
    console.warn(
      `${level.id}: not proven (${seconds} s), keeps ${known?.length ?? "no"} moves`,
    );
  } else if (!known || shortest.length < known.length) {
    solutions[level.id] = shortest;
    console.info(
      `${level.id}: ${known?.length ?? "–"} → ${shortest.length} moves (${proven}), ${seconds} s`,
    );
  } else {
    console.info(
      `${level.id}: keeps ${known.length} moves (found ${shortest.length}, ${proven}), ${seconds} s`,
    );
  }
}

// The file keeps its order; only solutions change.
writeFileSync(file, `${JSON.stringify(solutions, null, 2)}\n`);

/** A solution of the fewest moves, or undefined if MAX_STATES runs out. */
function search(level: ParsedLevel): string | undefined {
  const { width, walls, goals } = level;
  const size = walls.length;
  const steps = [
    [-1, "l"],
    [-width, "u"],
    [1, "r"],
    [width, "d"],
  ] as const;
  const FAR = 1 << 29;

  // Fewest pushes from each cell to any goal, found by pulling boxes back
  // from the goals. FAR means never: a box there is stuck.
  const pushes = new Int32Array(size).fill(FAR);
  const queue: number[] = [];
  goals.forEach((goal, cell) => {
    if (goal) {
      pushes[cell] = 0;
      queue.push(cell);
    }
  });
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head] as number;
    for (const [d] of steps) {
      const from = cell - d;
      const behind = cell - 2 * d;
      if (from < 0 || behind < 0 || from >= size || behind >= size) continue;
      if (walls[from] || walls[behind]) continue;
      if ((pushes[from] as number) > (pushes[cell] as number) + 1) {
        pushes[from] = (pushes[cell] as number) + 1;
        queue.push(from);
      }
    }
  }
  const estimate = (boxes: number[]) =>
    boxes.reduce((sum, box) => sum + (pushes[box] as number), 0);

  // Every state found, by number; `index` maps a state's key to its number.
  // Split across maps, since one Map holds at most 2^24 entries.
  const player: number[] = [];
  const boxesOf: number[][] = [];
  const parent: number[] = [];
  const letter: string[] = [];
  const cost: number[] = [];
  const index = Array.from({ length: 64 }, () => new Map<string, number>());
  const mapOf = (key: string) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return index[(hash >>> 0) % index.length] as Map<string, number>;
  };
  // Open states, bucketed by moves so far plus the estimate.
  const open: number[][] = [];
  let lowest = 0;

  const add = (
    at: number,
    boxes: number[],
    from: number,
    step: string,
    moves: number,
  ) => {
    const key = `${at}|${boxes.join(",")}`;
    const map = mapOf(key);
    const seen = map.get(key);
    if (seen !== undefined && (cost[seen] as number) <= moves) return;
    const n = player.length;
    player.push(at);
    boxesOf.push(boxes);
    parent.push(from);
    letter.push(step);
    cost.push(moves);
    map.set(key, n);
    const f = moves + Math.floor(WEIGHT * estimate(boxes));
    open[f] ??= [];
    open[f].push(n);
    if (f < lowest) lowest = f;
  };

  add(
    level.player,
    [...level.boxes.keys()].filter((i) => level.boxes[i]),
    -1,
    "",
    0,
  );
  while (player.length < MAX_STATES) {
    while (lowest < open.length && !open[lowest]?.length) lowest++;
    if (lowest >= open.length) return undefined;
    const n = (open[lowest] as number[]).pop() as number;
    const at = player[n] as number;
    const boxes = boxesOf[n] as number[];
    const moves = cost[n] as number;
    // Skip a state reached more cheaply since it was queued.
    const key = `${at}|${boxes.join(",")}`;
    if (mapOf(key).get(key) !== n) continue;
    if (boxes.every((box) => goals[box])) {
      let solution = "";
      for (let s = n; parent[s] !== -1; s = parent[s] as number) {
        solution = letter[s] + solution;
      }
      return solution;
    }
    for (const [d, step] of steps) {
      const to = at + d;
      if (walls[to]) continue;
      const pushed = boxes.indexOf(to);
      if (pushed < 0) {
        add(to, boxes, n, step, moves + 1);
        continue;
      }
      const boxTo = to + d;
      if (walls[boxTo] || boxes.includes(boxTo) || pushes[boxTo] === FAR)
        continue;
      const next = boxes.slice();
      next[pushed] = boxTo;
      next.sort((a, b) => a - b);
      add(to, next, n, step.toUpperCase(), moves + 1);
    }
  }
  return undefined;
}
