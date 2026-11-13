import {
  type Direction,
  deadSquares,
  directionToLetter,
  insideCells,
  isSolved,
  type LevelJson,
  letterToDirection,
  move,
  type ParsedLevel,
  parseLevel,
} from "@sokoban/core";
import { Application, type ColorSource, Graphics } from "pixi.js";
import { centerAxis, ease, followAxis, zoomTarget } from "./camera.ts";
import { Celebration } from "./celebration.ts";
import { Joystick } from "./joystick.ts";
import { listenToKeys } from "./keyboard.ts";

const TILE = 64;
/** Default space kept free around the board, in CSS pixels. */
const MARGIN = 24;

/** Board colors; any PixiJS color, such as a CSS color string. */
export interface GamePalette {
  wall: ColorSource;
  floor: ColorSource;
  goal: ColorSource;
  box: ColorSource;
  boxOnGoal: ColorSource;
  player: ColorSource;
}

// The light --board-* colors in apps/web/app/assets/css/main.css: black
// pieces on white floor, told apart by shape rather than color.
const DEFAULT_PALETTE: GamePalette = {
  wall: 0x000000,
  floor: 0xffffff,
  goal: 0x000000,
  box: 0x000000,
  boxOnGoal: 0x000000,
  player: 0x000000,
};

export interface GameProgress {
  moves: number;
  pushes: number;
  /** Moves so far as LURD letters; uppercase letters are pushes. */
  solution: string;
  solved: boolean;
  /** Undone moves that redo can bring back; any new move drops them. */
  canRedo: boolean;
  /** Boxes in the level, and how many of them are on goals. */
  boxes: number;
  boxesOnGoals: number;
  /** Boxes on dead squares, which can never reach a goal from there. */
  deadBoxes: number;
}

export interface GamePadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface OverviewState {
  /** The level is bigger than the screen, so an overview shows more. */
  available: boolean;
  /** The overview is showing (toggled on, or Space held). */
  active: boolean;
}

export interface GameOptions {
  /** Space to keep free around the board, in CSS pixels; 24 on each side by default. */
  padding?: GamePadding;
  /** Board colors; light ones by default. */
  palette?: Partial<GamePalette>;
  /**
   * Moves to start from, as LURD, e.g. a half-played run saved earlier. The
   * level starts fresh if they don't replay or already solve it.
   */
  initialSolution?: string;
  /** Called after every move, undo, restart and level change. */
  onChange?: (progress: GameProgress) => void;
  /** Called on the move that solves the level. */
  onSolved?: (progress: GameProgress) => void;
  /** Called whenever the overview's availability or visibility changes. */
  onOverviewChange?: (state: OverviewState) => void;
}

export interface Game {
  /** Replaces the current level. Throws `LevelParseError` if it is invalid. */
  setLevel(level: LevelJson): void;
  /** Takes back the last move. */
  undo(): void;
  /** Plays the last undone move again. */
  redo(): void;
  /** Returns to the start of the level. */
  restart(): void;
  /** Zooms out to show the whole level, or back to the player. */
  setOverview(on: boolean): void;
  /** Redraws the board in new colors, e.g. when the theme changes. */
  setPalette(palette: Partial<GamePalette>): void;
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
  // Where a box can never reach a goal; the level's walls and goals never change.
  let dead = deadSquares(start);
  let palette = { ...DEFAULT_PALETTE, ...options.palette };
  let history: Step[] = [];
  // Undone steps, the most recently undone last.
  let future: Step[] = [];
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
  // A sibling of the board rather than a child: Graphics can't have children.
  const celebration = new Celebration(app.renderer);
  const joystick = new Joystick(app.stage, palette.player, (direction) =>
    step(direction),
  );
  app.stage.addChild(board, celebration.view, joystick);
  app.ticker.add((ticker) => {
    joystick.update(ticker.deltaMS);
    followCamera(ticker.deltaMS);
    celebration.update(ticker.deltaMS);
  });
  const stopKeyboard = listenToKeys({
    onStep: (direction) => step(direction),
    onPeek: (on) => {
      peeking = on;
    },
    onAction: (action) => {
      if (action === "undo") undo();
      else if (action === "redo") redo();
      else restart();
    },
  });

  const {
    top = MARGIN,
    right = MARGIN,
    bottom = MARGIN,
    left = MARGIN,
  } = options.padding ?? {};

  // Where the board's top-left corner sits within the play area.
  const camera = { x: 0, y: 0 };
  // On-screen tile size; eases towards the zoom target.
  let tile = 1;
  let toggled = false;
  let peeking = false;
  let overview: OverviewState = { available: false, active: false };

  const playArea = () => ({
    width: Math.max(app.screen.width - left - right, 0),
    height: Math.max(app.screen.height - top - bottom, 0),
  });

  const zoom = () =>
    zoomTarget(playArea(), start.width, start.height, toggled || peeking);

  /** Board size and player centre at a tile size, in screen pixels. */
  const measure = (size: number) => {
    const { player, width } = current();
    return {
      board: { width: start.width * size, height: start.height * size },
      player: {
        x: ((player % width) + 0.5) * size,
        y: (Math.floor(player / width) + 0.5) * size,
      },
    };
  };

  const placeBoard = () => {
    board.scale.set(tile / TILE);
    board.position.set(left + camera.x, top + camera.y);
    celebration.view.scale.copyFrom(board.scale);
    celebration.view.position.copyFrom(board.position);
  };

  const reportOverview = (available: boolean) => {
    const active = available && (toggled || peeking);
    if (overview.available === available && overview.active === active) {
      return;
    }
    overview = { available, active };
    options.onOverviewChange?.(overview);
  };

  /** Jumps to the player, e.g. when a level loads or the canvas resizes. */
  const snapCamera = () => {
    const area = playArea();
    const target = zoom();
    tile = Math.max(target.tile, 1);
    const { board: size, player } = measure(tile);
    camera.x = centerAxis(area.width, size.width, player.x);
    camera.y = centerAxis(area.height, size.height, player.y);
    placeBoard();
    reportOverview(target.available);
  };

  /** Eases the zoom and follows the player once they leave the dead zone. */
  function followCamera(deltaMs: number) {
    const area = playArea();
    const target = zoom();
    const next = Math.max(ease(tile, target.tile, deltaMs), 1);

    // Zoom around the player, so they stay put on screen while it changes.
    const before = measure(tile).player;
    const after = measure(next).player;
    camera.x += before.x - after.x;
    camera.y += before.y - after.y;
    tile = next;

    const { board: size, player } = measure(tile);
    const x = followAxis(area.width, size.width, player.x, camera.x);
    const y = followAxis(area.height, size.height, player.y, camera.y);
    camera.x = ease(camera.x, x, deltaMs);
    camera.y = ease(camera.y, y, deltaMs);
    placeBoard();
    reportOverview(target.available);
  }

  const update = () => {
    const level = current();
    drawLevel(board, level, dead, palette);
    let boxes = 0;
    let boxesOnGoals = 0;
    let deadBoxes = 0;
    for (let i = 0; i < level.boxes.length; i++) {
      if (!level.boxes[i]) continue;
      boxes++;
      if (level.goals[i]) boxesOnGoals++;
      if (dead[i]) deadBoxes++;
    }
    const progress: GameProgress = {
      moves: history.length,
      pushes: history.filter((s) => s.pushed).length,
      solution: history.map((s) => s.letter).join(""),
      solved: isSolved(level),
      canRedo: future.length > 0,
      boxes,
      boxesOnGoals,
      deadBoxes,
    };
    options.onChange?.(progress);
    return progress;
  };

  function step(direction: Direction) {
    if (isSolved(current())) return;
    const result = move(current(), direction);
    if (!result) return;

    future = [];
    play({
      level: result.level,
      letter: directionToLetter(direction, result.pushed),
      pushed: result.pushed,
    });
  }

  function play(next: Step) {
    history.push(next);
    const progress = update();
    if (progress.solved) {
      celebrate();
      options.onSolved?.(progress);
    }
  }

  function undo() {
    const last = history.pop();
    if (!last) return;
    future.push(last);
    celebration.clear();
    update();
  }

  function redo() {
    const next = future.pop();
    if (next) play(next);
  }

  function restart() {
    history = [];
    future = [];
    celebration.clear();
    update();
  }

  /** Sparks from every goal, unless the system asks for less motion. */
  function celebrate() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { goals, width } = current();
    const points = [];
    for (let i = 0; i < goals.length; i++) {
      if (!goals[i]) continue;
      points.push({
        x: ((i % width) + 0.5) * TILE,
        y: (Math.floor(i / width) + 0.5) * TILE,
      });
    }
    celebration.burst(points, [
      palette.goal,
      palette.boxOnGoal,
      palette.player,
    ]);
  }

  history = replaySteps(start, options.initialSolution ?? "");
  update();
  snapCamera();
  app.renderer.on("resize", snapCamera);

  // ResizePlugin only listens to window resizes; also track the container.
  const observer = new ResizeObserver(() => app.queueResize());
  observer.observe(container);

  return {
    setLevel(next) {
      start = parseLevel(next);
      dead = deadSquares(start);
      history = [];
      future = [];
      toggled = false;
      celebration.clear();
      update();
      snapCamera();
    },
    undo,
    redo,
    restart,
    setOverview(on) {
      toggled = on;
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
      drawLevel(board, current(), dead, palette);
      joystick.setColor(palette.player);
    },
    destroy() {
      stopKeyboard();
      observer.disconnect();
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true },
      );
      // After the app: its renderer still has the spark texture bound until
      // the scene is torn down.
      celebration.destroy();
    },
  };
}

/**
 * The steps for a LURD string from `start`, or none if a move is blocked or
 * the moves solve the level.
 */
function replaySteps(start: ParsedLevel, solution: string): Step[] {
  const steps: Step[] = [];
  let level = start;
  for (const letter of solution) {
    const direction = letterToDirection(letter);
    const result = direction && move(level, direction);
    if (!direction || !result) return [];
    level = result.level;
    steps.push({
      level,
      letter: directionToLetter(direction, result.pushed),
      pushed: result.pushed,
    });
  }
  return isSolved(level) ? [] : steps;
}

/**
 * Square pieces on a 64-unit tile, told apart by shape and fill, not color.
 * apps/web/app/components/LevelPreview.vue draws the same shapes in SVG.
 * A box on a dead square gets a cross for its centre: a warning only, since
 * the move stays allowed and undo takes it back.
 */
function drawLevel(
  g: Graphics,
  level: ParsedLevel,
  dead: Uint8Array,
  colors: GamePalette,
) {
  const cellX = (i: number) => (i % level.width) * TILE;
  const cellY = (i: number) => Math.floor(i / level.width) * TILE;

  const inside = insideCells(level);

  g.clear();
  for (let i = 0; i < level.walls.length; i++) {
    const x = cellX(i);
    const y = cellY(i);
    if (level.walls[i]) {
      // Slightly inset, like the tiles in the web previews.
      g.rect(x + 1, y + 1, TILE - 2, TILE - 2).fill(colors.wall);
    } else if (inside[i]) {
      g.rect(x, y, TILE, TILE).fill(colors.floor);
    }
    if (level.boxes[i] && level.goals[i]) {
      // Box on goal: solid, with a check cut out in the floor colour, so it
      // reads as a finished box rather than a wall (a stuck box gets a cross).
      g.rect(x + 7, y + 7, 50, 50).fill(colors.boxOnGoal);
      g.moveTo(x + 19, y + 33)
        .lineTo(x + 28, y + 42)
        .lineTo(x + 45, y + 23)
        .stroke({ width: 6, color: colors.floor, cap: "round", join: "round" });
    } else if (level.boxes[i]) {
      // Box: thick frame with a solid centre, or a cross once it's stuck.
      g.rect(x + 10, y + 10, 44, 44).stroke({ width: 6, color: colors.box });
      if (dead[i]) {
        g.moveTo(x + 20, y + 20)
          .lineTo(x + 44, y + 44)
          .moveTo(x + 44, y + 20)
          .lineTo(x + 20, y + 44)
          .stroke({ width: 5, color: colors.box });
      } else {
        g.rect(x + 26, y + 26, 12, 12).fill(colors.box);
      }
    } else if (level.goals[i]) {
      // Goal: small thin frame.
      g.rect(x + 22, y + 22, 20, 20).stroke({ width: 3, color: colors.goal });
    }
  }
  // Player: a solid diamond (a square turned 45°). A goal beneath it shows as
  // its own small frame cut out of the diamond, so no goal is ever hidden.
  const px = cellX(level.player);
  const py = cellY(level.player);
  g.poly([
    px + 32,
    py + 8,
    px + 56,
    py + 32,
    px + 32,
    py + 56,
    px + 8,
    py + 32,
  ]).fill(colors.player);
  if (level.goals[level.player]) {
    g.rect(px + 22, py + 22, 20, 20).stroke({ width: 3, color: colors.floor });
  }
}
