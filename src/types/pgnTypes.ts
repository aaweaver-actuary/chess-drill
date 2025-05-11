import { PromotionPiece, ChessSquare } from '@/enums';

// Define a type for parsed PGN moves, including recursive RAVs
export interface PgnMove {
  move: string;
  from?: ChessSquare;
  to?: ChessSquare;
  promotion?: PromotionPiece;
  comment?: string;
  nag?: string[];
  rav?: { moves: PgnMove[] }[];
  [key: string]: any;

}

export interface PgnRav {
  moves: PgnMove[];
}

// The overall structure of parsed PGN data
export interface ParsedPgn {
  moves: PgnMove[];
  tags?: Record<string, string>;
  result?: string;
  startingFEN?: string;
}

// Interface for the objects expected in the array passed to generateVariationKey
export interface MoveForVariationKey {
  move: string;
  [key: string]: any;
}

export interface Variation {
  moves: PgnMove[];
  tags?: Record<string, string>;
  startingFEN?: string;
  result?: string;
  [key: string]: any;
}
