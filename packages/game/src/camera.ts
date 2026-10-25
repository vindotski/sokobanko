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

/**
 * Tile size to zoom to. The overview zooms out until the whole board fits,
 * and is only `available` when that is smaller than the normal zoom.
 */
export function zoomTarget(
  area: { width: number; height: number },
  cols: number,
  rows: number,
  overview: boolean,
) {
  const normal = tileSize(area);
  const fit = fitTileSize(area, cols, rows);
  const available = fit < normal;
  return { tile: overview && available ? fit : normal, available };
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
