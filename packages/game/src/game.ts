import {
  type Direction,
  directionToLetter,
  insideCells,
  isSolved,
  type LevelJson,
  move,
  type ParsedLevel,
  parseLevel,
} from "@sokobanko/core";
import { Application, Graphics } from "pixi.js";
import { Joystick } from "./joystick.ts";
import { listenToMovementKeys } from "./keyboard.ts";

const TILE = 64;
/** Default space kept free around the board, in CSS pixels. */
const MARGIN = 24;
/** Largest on-screen tile, so small levels don't turn into giant blocks. */
const MAX_TILE = 96;

// Same colors as the --board-* variables in apps/web/app/assets/css/main.css.
const COLORS = {
  wall: 0x475569,
  floor: 0xfaf7f0,
  goal: 0xf59e0b,
  box: 0xb45309,
  boxOnGoal: 0x16a34a,
  player: 0x2563eb,
};

export interface GameProgress {
  moves: number;
  pushes: number;
  /** Moves so far as LURD letters; uppercase letters are pushes. */
  solution: string;
  solved: boolean;
}

export interface GamePadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface GameOptions {
  /** Space to keep free around the board, in CSS pixels; 24 on each side by default. */
  padding?: GamePadding;
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
  const stopKeyboard = listenToMovementKeys((direction) => step(direction));

  const {
    top = MARGIN,
    right = MARGIN,
    bottom = MARGIN,
    left = MARGIN,
  } = options.padding ?? {};

  const layout = () => {
    const width = start.width * TILE;
    const height = start.height * TILE;
    const available = {
      width: app.screen.width - left - right,
      height: app.screen.height - top - bottom,
    };
    const scale = Math.max(
      Math.min(
        available.width / width,
        available.height / height,
        MAX_TILE / TILE,
      ),
      0.01,
    );
    board.scale.set(scale);
    board.position.set(
      left + (available.width - width * scale) / 2,
      top + (available.height - height * scale) / 2,
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

  const inside = insideCells(level);

  g.clear();
  for (let i = 0; i < level.walls.length; i++) {
    const x = cellX(i);
    const y = cellY(i);
    if (level.walls[i]) {
      // Slightly inset, like the tiles in the web previews.
      g.roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 2).fill(COLORS.wall);
    } else if (inside[i]) {
      g.rect(x, y, TILE, TILE).fill(COLORS.floor);
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
