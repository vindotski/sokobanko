import { type LevelJson, type ParsedLevel, parseLevel } from "@sokobanko/core";
import { Application, Graphics } from "pixi.js";

const TILE = 64;

const COLORS = {
  wall: 0x52525b,
  goal: 0xf59e0b,
  box: 0xa16207,
  boxOnGoal: 0x16a34a,
  player: 0x3b82f6,
};

export interface Game {
  /** Replaces the current level. Throws `LevelParseError` if it is invalid. */
  setLevel(level: LevelJson): void;
  destroy(): void;
}

/**
 * Renders `level` into `container`, scaled to fit and centered. The canvas
 * follows the container's size, so the container must be sized by CSS.
 */
export async function createGame(
  container: HTMLElement,
  level: LevelJson,
): Promise<Game> {
  let parsed = parseLevel(level);

  const app = new Application();
  await app.init({
    resizeTo: container,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  });
  container.appendChild(app.canvas);

  const board = new Graphics();
  app.stage.addChild(board);

  const layout = () => {
    const width = parsed.width * TILE;
    const height = parsed.height * TILE;
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

  const render = () => {
    drawLevel(board, parsed);
    layout();
  };

  render();
  app.renderer.on("resize", layout);

  // ResizePlugin only listens to window resizes; also track the container.
  const observer = new ResizeObserver(() => app.queueResize());
  observer.observe(container);

  return {
    setLevel(next) {
      parsed = parseLevel(next);
      render();
    },
    destroy() {
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
