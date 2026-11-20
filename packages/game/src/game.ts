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
  replayLog,
  UNDO,
  UNDO_BUDGET,
} from "@sokoban/core";
import { Application, type ColorSource, Graphics } from "pixi.js";
// Pixi's shader code without eval, so the site's CSP needs no 'unsafe-eval'.
import "pixi.js/unsafe-eval";
import {
  centerAxis,
  clampTile,
  ease,
  followAxis,
  panAxis,
  zoomAround,
  zoomBounds,
} from "./camera.ts";
import { Celebration } from "./celebration.ts";
import { listenToGestures, type Point } from "./gestures.ts";
import { Joystick } from "./joystick.ts";
import { listenToKeys } from "./keyboard.ts";

const TILE = 64;
/** How much the zoom buttons and keys zoom per press. */
const ZOOM_STEP = 1.25;
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
  /**
   * Everything played this run, undos included: LURD letters, and `z` for
   * each undo. The server replays it to check the undo budget.
   */
  log: string;
  /** Undos still allowed this run; restart refills them. */
  undosLeft: number;
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

export interface CameraState {
  /** Zoom in or out would change anything (the zoom is within its bounds). */
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** The whole level is on screen. */
  fitted: boolean;
  /** The camera follows the player; panning or zooming by hand stops that. */
  following: boolean;
}

export interface GameOptions {
  /** Space to keep free around the board, in CSS pixels; 24 on each side by default. */
  padding?: GamePadding;
  /** Board colors; light ones by default. */
  palette?: Partial<GamePalette>;
  /**
   * A run to resume, as an input log (see `GameProgress.log`), e.g. a
   * half-played run saved earlier; undos it used stay used. The level starts
   * fresh if it doesn't replay or already solves it.
   */
  initialLog?: string;
  /** Called after every move, undo, restart and level change. */
  onChange?: (progress: GameProgress) => void;
  /** Called on the move that solves the level. */
  onSolved?: (progress: GameProgress) => void;
  /** Called whenever the camera's state changes. */
  onCameraChange?: (state: CameraState) => void;
}

export interface Game {
  /** Replaces the current level. Throws `LevelParseError` if it is invalid. */
  setLevel(level: LevelJson): void;
  /** Takes back the last move, while the run has undos left. */
  undo(): void;
  /** Plays the last undone move again. */
  redo(): void;
  /** Returns to the start of the level, as a new run with a full undo budget. */
  restart(): void;
  /** Zooms in or out a step, around the player if the camera follows them. */
  zoomIn(): void;
  zoomOut(): void;
  /** Zooms out until the whole level is on screen. */
  fit(): void;
  /** Follows the player again, after panning or zooming away. */
  recenter(): void;
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
  // This run's input log and the undos it has used.
  let log = "";
  let undos = 0;
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
  // Two fingers or a wheel move the camera; one finger stays the joystick.
  const stopGestures = listenToGestures(app.stage, app.canvas, {
    onPinchStart: () => joystick.cancel(),
    onZoom: (factor, at) => zoomAt(factor, at),
    onPan: (dx, dy) => pan(dx, dy),
  });
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
      else if (action === "restart") restart();
      else zoomBy(action === "zoomIn" ? ZOOM_STEP : 1 / ZOOM_STEP);
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
  // On-screen tile size; eases towards `zoom` (or the fit while peeking).
  let tile = 1;
  // The tile size the player chose; the screen's default until they zoom.
  let zoom: number | undefined;
  // Follows the player, until they pan or zoom by hand; any move resumes it.
  let following = true;
  // Where a zoom eases around while the camera doesn't follow the player.
  let focus: Point | undefined;
  let peeking = false;
  let state: CameraState | undefined;

  const playArea = () => ({
    width: Math.max(app.screen.width - left - right, 0),
    height: Math.max(app.screen.height - top - bottom, 0),
  });
  const bounds = () => zoomBounds(playArea(), start.width, start.height);
  /** The tile size the camera eases towards. */
  const target = () => {
    const b = bounds();
    const chosen = clampTile(zoom ?? b.normal, b);
    return peeking ? Math.min(chosen, b.fit) : chosen;
  };

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

  const reportCamera = () => {
    const b = bounds();
    const chosen = clampTile(zoom ?? b.normal, b);
    const next: CameraState = {
      canZoomIn: chosen < b.max - 0.5,
      canZoomOut: chosen > b.min + 0.5,
      fitted: target() <= b.fit + 0.5,
      following,
    };
    if (
      state &&
      state.canZoomIn === next.canZoomIn &&
      state.canZoomOut === next.canZoomOut &&
      state.fitted === next.fitted &&
      state.following === next.following
    ) {
      return;
    }
    state = next;
    options.onCameraChange?.(next);
  };

  /** Keeps the board within the play area at the current zoom. */
  const clampCamera = () => {
    const area = playArea();
    const { board: size } = measure(tile);
    camera.x = panAxis(area.width, size.width, camera.x, 0);
    camera.y = panAxis(area.height, size.height, camera.y, 0);
  };

  /** Jumps to the player, e.g. when a level loads or the canvas resizes. */
  const snapCamera = () => {
    const area = playArea();
    if (zoom !== undefined) zoom = clampTile(zoom, bounds());
    tile = Math.max(target(), 1);
    const { board: size, player } = measure(tile);
    camera.x = centerAxis(area.width, size.width, player.x);
    camera.y = centerAxis(area.height, size.height, player.y);
    following = true;
    focus = undefined;
    placeBoard();
    reportCamera();
  };

  /** Eases the zoom, and follows the player once they leave the dead zone. */
  function followCamera(deltaMs: number) {
    const area = playArea();
    const next = Math.max(ease(tile, target(), deltaMs), 1);

    // Zoom around the player while following, so they stay put on screen;
    // otherwise around where the zoom was asked for.
    if (following || !focus) {
      const before = measure(tile).player;
      const after = measure(next).player;
      camera.x += before.x - after.x;
      camera.y += before.y - after.y;
    } else {
      camera.x = zoomAround(camera.x, tile, next, focus.x);
      camera.y = zoomAround(camera.y, tile, next, focus.y);
    }
    tile = next;

    if (following) {
      const { board: size, player } = measure(tile);
      const x = followAxis(area.width, size.width, player.x, camera.x);
      const y = followAxis(area.height, size.height, player.y, camera.y);
      camera.x = ease(camera.x, x, deltaMs);
      camera.y = ease(camera.y, y, deltaMs);
    } else {
      clampCamera();
    }
    placeBoard();
    reportCamera();
  }

  /**
   * Zooms by `factor`, eased, around a point in the play area: the player
   * while following, else the middle of the screen.
   */
  function zoomBy(factor: number) {
    const b = bounds();
    zoom = clampTile((zoom ?? b.normal) * factor, b);
    const area = playArea();
    focus = { x: area.width / 2, y: area.height / 2 };
    reportCamera();
  }

  /**
   * Zooms by `factor` at once around `at` (canvas pixels), as fingers or a
   * wheel do. Stops following the player.
   */
  function zoomAt(factor: number, at: Point) {
    const b = bounds();
    const next = clampTile((zoom ?? b.normal) * factor, b);
    // Already as far in or out as it goes: nothing moves, so keep following.
    if (Math.abs(next - tile) < 0.01) return;
    zoom = next;
    const focal = { x: at.x - left, y: at.y - top };
    camera.x = zoomAround(camera.x, tile, zoom, focal.x);
    camera.y = zoomAround(camera.y, tile, zoom, focal.y);
    tile = zoom;
    following = false;
    focus = focal;
    clampCamera();
    placeBoard();
    reportCamera();
  }

  /**
   * Drags the board by (dx, dy) pixels. Stops following the player, unless
   * the board couldn't move (it fits, or is at its edge).
   */
  function pan(dx: number, dy: number) {
    const area = playArea();
    const { board: size } = measure(tile);
    const x = panAxis(area.width, size.width, camera.x, dx);
    const y = panAxis(area.height, size.height, camera.y, dy);
    if (Math.abs(x - camera.x) < 0.5 && Math.abs(y - camera.y) < 0.5) return;
    camera.x = x;
    camera.y = y;
    following = false;
    placeBoard();
    reportCamera();
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
      log,
      undosLeft: UNDO_BUDGET - undos,
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
    // Moving brings the camera back to the player, at the chosen zoom.
    following = true;
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
    log += next.letter;
    const progress = update();
    if (progress.solved) {
      celebrate();
      options.onSolved?.(progress);
    }
  }

  function undo() {
    if (undos >= UNDO_BUDGET || !history.length) return;
    const last = history.pop();
    if (!last) return;
    undos++;
    log += UNDO;
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
    log = "";
    undos = 0;
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

  /** Picks up a saved run where it left off, or starts fresh if it doesn't replay. */
  function resume(saved: string) {
    try {
      const run = replayLog(start, saved);
      if (run.solved) return;
      history = replaySteps(start, run.solution);
      log = saved;
      undos = run.undos;
    } catch {}
  }

  resume(options.initialLog ?? "");
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
      log = "";
      undos = 0;
      zoom = undefined;
      celebration.clear();
      update();
      snapCamera();
    },
    undo,
    redo,
    restart,
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(1 / ZOOM_STEP),
    fit() {
      zoom = bounds().fit;
      following = true;
      reportCamera();
    },
    recenter() {
      following = true;
      reportCamera();
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
      drawLevel(board, current(), dead, palette);
      joystick.setColor(palette.player);
    },
    destroy() {
      stopKeyboard();
      stopGestures();
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
