/** One to three stars for a solve. */
export type Stars = 1 | 2 | 3;

/** How far over par still earns two stars: a quarter more moves. */
export const TWO_STAR_MARGIN = 1.25;

/**
 * Stars for solving a level in `moves`, against its par: the fewest moves
 * known for it. Three at par or under (a player can beat a par that isn't
 * proven fewest), two within a quarter over it, and one for any solve.
 */
export function starsFor(moves: number, par: number): Stars {
  if (moves <= par) return 3;
  if (moves <= twoStarLimit(par)) return 2;
  return 1;
}

/** The most moves that still earn two stars. */
export function twoStarLimit(par: number): number {
  return Math.floor(par * TWO_STAR_MARGIN);
}
