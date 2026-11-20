/** One node on the map's path: its grid cell, from 0. */
export interface PathCell {
  row: number;
  col: number;
}

/**
 * Where `count` levels sit on a winding path `columns` wide: left to right on
 * even rows, right to left on odd ones, so each level is next to the one
 * before it, like a snake.
 */
export function pathCells(count: number, columns: number): PathCell[] {
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / columns);
    const step = i % columns;
    return { row, col: row % 2 === 0 ? step : columns - 1 - step };
  });
}

/** The path's line through the cells' centres, as SVG points. */
export function pathLine(cells: PathCell[], pitch: number, size: number) {
  return cells
    .map(
      ({ row, col }) => `${col * pitch + size / 2},${row * pitch + size / 2}`,
    )
    .join(" ");
}
