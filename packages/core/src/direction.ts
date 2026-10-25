/** A grid step: up, down, left or right. Matches the LURD solution letters. */
export type Direction = "U" | "D" | "L" | "R";

const LETTERS: Record<Direction, string> = { U: "u", D: "d", L: "l", R: "r" };

/** Solution letter for a step: lowercase for a walk, uppercase for a push. */
export function directionToLetter(direction: Direction, pushed: boolean) {
  const letter = LETTERS[direction];
  return pushed ? letter.toUpperCase() : letter;
}

/** Direction for a solution letter in either case, or `null` if invalid. */
export function letterToDirection(letter: string): Direction | null {
  switch (letter.toLowerCase()) {
    case "u":
      return "U";
    case "d":
      return "D";
    case "l":
      return "L";
    case "r":
      return "R";
    default:
      return null;
  }
}
