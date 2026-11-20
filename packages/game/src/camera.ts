// Camera math for the play view, in screen pixels. Each axis is handled on
// its own: `length` is the visible play area, `board` the board's on-screen
// size, `player` the player's centre in board pixels, and `offset` where the
// board's top/left edge sits within the play area.

const MIN_TILE = 32;
const MAX_TILE = 80;
/** Tile size as a share of the play area's shorter side. */
const TILE_SHARE = 0.1;
/** The camera stays still while the player is this far from either edge. */
const DEAD_ZONE_MARGIN = 0.3;
/** Time constant of the camera's easing, in milliseconds. */
const EASE_MS = 100;

/** On-screen tile size for a play area: set by the screen, not the level. */
export function tileSize(area: { width: number; height: number }) {
  const size = Math.min(area.width, area.height) * TILE_SHARE;
  return Math.min(Math.max(size, MIN_TILE), MAX_TILE);
}

/** Largest tile size at which the whole board fits in the play area. */
export function fitTileSize(
  area: { width: number; height: number },
  cols: number,
  rows: number,
) {
  return Math.min(area.width / cols, area.height / rows);
}

/** The closest a player can zoom in, as a tile size in pixels. */
const MAX_ZOOM_TILE = 96;

export interface ZoomBounds {
  /** The default tile size for this screen (tileSize). */
  normal: number;
  /** The tile size at which the whole board fits (fitTileSize). */
  fit: number;
  /** No further out than the whole level, or the default if it fits already. */
  min: number;
  /** No further in than 96 px tiles. */
  max: number;
}

/** How far a player may zoom on this screen, for a board of cols × rows. */
export function zoomBounds(
  area: { width: number; height: number },
  cols: number,
  rows: number,
): ZoomBounds {
  const normal = tileSize(area);
  const fit = fitTileSize(area, cols, rows);
  return {
    normal,
    fit,
    min: Math.min(fit, normal),
    max: Math.max(MAX_ZOOM_TILE, normal),
  };
}

/** A tile size kept within the bounds. */
export function clampTile(tile: number, bounds: ZoomBounds) {
  return Math.min(Math.max(tile, bounds.min), bounds.max);
}

/**
 * The offset after zooming from `from` to `to` px tiles that keeps the board
 * point under `focal` (a position in the play area, like the fingers or the
 * cursor) where it is on screen. One axis.
 */
export function zoomAround(
  offset: number,
  from: number,
  to: number,
  focal: number,
) {
  return focal - (focal - offset) * (to / from);
}

/**
 * The offset after dragging the board by `delta` px. The board can't be
 * dragged past its own edges, and stays centred when it fits. One axis.
 */
export function panAxis(
  length: number,
  board: number,
  offset: number,
  delta: number,
) {
  if (board <= length) return (length - board) / 2;
  return clampOffset(length, board, offset + delta);
}

/** Keeps the board from scrolling past its own edges. */
function clampOffset(length: number, board: number, offset: number) {
  return Math.min(Math.max(offset, length - board), 0);
}

/**
 * Offset that puts the player in the middle of the play area, or centres the
 * board when it fits. Used when a level loads and on resize.
 */
export function centerAxis(length: number, board: number, player: number) {
  if (board <= length) return (length - board) / 2;
  return clampOffset(length, board, length / 2 - player);
}

/**
 * Offset to move towards while playing: unchanged while the player is inside
 * the dead zone, otherwise just enough to bring them back to its edge.
 */
export function followAxis(
  length: number,
  board: number,
  player: number,
  offset: number,
) {
  if (board <= length) return (length - board) / 2;

  const low = length * DEAD_ZONE_MARGIN;
  const high = length * (1 - DEAD_ZONE_MARGIN);
  const onScreen = player + offset;
  let next = offset;
  if (onScreen < low) next = low - player;
  else if (onScreen > high) next = high - player;
  return clampOffset(length, board, next);
}

/** Moves `current` towards `target`, independent of frame rate. */
export function ease(current: number, target: number, deltaMs: number) {
  return current + (target - current) * (1 - Math.exp(-deltaMs / EASE_MS));
}
