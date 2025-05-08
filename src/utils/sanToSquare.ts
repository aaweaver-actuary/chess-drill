import { ChessSquare } from "@/enums/ChessSquare";

interface FileToIdx {
  [key: string]: number;
}

/**
 * sanToSquare function converts a standard algebraic notation (SAN) string to a ChessSquare enum value.
 * The SAN string should be in the format of a chess move, e.g., "e4", "Nf3", etc.
 * The function returns the corresponding ChessSquare enum value.
 */
export default function sanToSquare(san: string): ChessSquare {
  const fileToIdx: FileToIdx = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
  }
  const fileChar = san.charAt(0).toLowerCase();
  const file = fileToIdx[fileChar];
  const rankChar = san.charAt(1);
  const rank = parseInt(rankChar, 10) - 1;
  if (isNaN(rank) || rank < 0 || rank > 7 || file === undefined) {
    throw new Error(`Invalid SAN: ${san}`);
  }
  if (file < 0 || file > 7) {
    throw new Error(`Invalid file: ${fileChar}`);
  }
  return file*8 + rank as ChessSquare;
}
