import {
  type Direction,
  directionToLetter,
  isSolved,
  type LevelJson,
  move,
  type ParsedLevel,
  parseLevel,
} from "@sokobanko/core";
import { Application, Graphics } from "pixi.js";
import { Joystick } from "./joystick.ts";
import { listenToArrowKeys } from "./keyboard.ts";

const TILE = 64;

const COLORS = {
  wall: 0x52525b,
  goal: 0xf59e0b,
  box: 0xa16207,
  boxOnGoal: 0x16a34a,
  player: 0x3b82f6,
};

export interface GameProgress {
  moves: number;
  pushes: number;
  /** Moves so far as LURD letters; uppercase letters are pushes. */
  solution: string;
  solved: boolean;
}

export interface GameOptions {
  /** Called after every move, undo, restart and level change. */
  onChange?: (progress: GameProgress) => void;
  /** Called on the move that solves the level. */
  onSolved?: (progress: GameProgress) => void;
}

export interface Game {
  /** Replaces the current level. Throws `LevelParseError` if it is invalid. */
  setLevel(level: LevelJson): void;
  /** Takes back the last move. */
  undo(): void;
  /** Returns to the start of the level. */
  restart(): void;
  destroy(): void;
}

interface Step {
  level: ParsedLevel;
  letter: string;
  pushed: boolean;
}

/**
 * Renders `level` into `container`, scaled to fit and centered. The canvas
 * follows the container's size, so the container must be sized by CSS.
 */
export async function createGame(
  container: HTMLElement,
  level: LevelJson,
  options: GameOptions = {},
): Promise<Game> {
  let start = parseLevel(level);
  let history: Step[] = [];
  const current = () => history.at(-1)?.level ?? start;

  const app = new Application();
  await app.init({
    resizeTo: container,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  });
  container.appendChild(app.canvas);

  // Make the whole canvas a pointer target for the joystick.
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const board = new Graphics();
  const joystick = new Joystick(app.stage, (direction) => step(direction));
  app.stage.addChild(board, joystick);
  app.ticker.add((ticker) => joystick.update(ticker.deltaMS));
  const stopKeyboard = listenToArrowKeys((direction) => step(direction));

  const layout = () => {
    const width = start.width * TILE;
    const height = start.height * TILE;
    const scale = Math.min(
      app.screen.width / width,
      app.screen.height / height,
    );
    board.scale.set(scale);
    board.position.set(
      (app.screen.width - width * scale) / 2,
      (app.screen.height - height * scale) / 2,
    );
  };

  const update = () => {
    drawLevel(board, current());
    const progress: GameProgress = {
      moves: history.length,
      pushes: history.filter((s) => s.pushed).length,
      solution: history.map((s) => s.letter).join(""),
      solved: isSolved(current()),
    };
    options.onChange?.(progress);
    return progress;
  };

  function step(direction: Direction) {
    if (isSolved(current())) return;
    const result = move(current(), direction);
    if (!result) return;

    history.push({
      level: result.level,
      letter: directionToLetter(direction, result.pushed),
      pushed: result.pushed,
    });
    const progress = update();
    if (progress.solved) options.onSolved?.(progress);
  }

  update();
  layout();
  app.renderer.on("resize", layout);

  // ResizePlugin only listens to window resizes; also track the container.
  const observer = new ResizeObserver(() => app.queueResize());
  observer.observe(container);

  return {
    setLevel(next) {
      start = parseLevel(next);
      history = [];
      update();
      layout();
    },
    undo() {
      if (history.pop()) update();
    },
    restart() {
      history = [];
      update();
    },
    destroy() {
      stopKeyboard();
      observer.disconnect();
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true },
      );
    },
  };
}

function drawLevel(g: Graphics, level: ParsedLevel) {
  const cellX = (i: number) => (i % level.width) * TILE;
  const cellY = (i: number) => Math.floor(i / level.width) * TILE;

  g.clear();
  for (let i = 0; i < level.walls.length; i++) {
    const x = cellX(i);
    const y = cellY(i);
    if (level.walls[i]) {
      g.rect(x, y, TILE, TILE).fill(COLORS.wall);
    }
    if (level.goals[i]) {
      g.circle(x + TILE / 2, y + TILE / 2, TILE * 0.15).fill(COLORS.goal);
    }
    if (level.boxes[i]) {
      g.roundRect(x + 6, y + 6, TILE - 12, TILE - 12, 8).fill(
        level.goals[i] ? COLORS.boxOnGoal : COLORS.box,
      );
    }
  }
  g.circle(
    cellX(level.player) + TILE / 2,
    cellY(level.player) + TILE / 2,
    TILE * 0.3,
  ).fill(COLORS.player);
}
