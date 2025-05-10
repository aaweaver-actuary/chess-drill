// src/types/pgnTypes.ts

import { PromotionPiece } from "@/enums/ChessPiece";
import { ChessSquare } from "@/enums/ChessSquare";
import { Chess } from "chess.js";

// Define a type for parsed PGN moves, including recursive RAVs
export interface PgnMove {
  move: ChessSquare;
  from?: ChessSquare; // Starting square, e.g., 'e2'
  to?: ChessSquare; // Ending square, e.g., 'e4'
  promotion?: PromotionPiece;
  comment?: string;
  nag?: string[];
  rav?: PgnRav[];
  [key: string]: any; // For other potential properties from parser
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
  // Other properties that might be present in parsed PGN
}

// Structure for flattened variation lines
export interface VariationLine {
  moves: PgnMove[]; // Without 'rav' properties
  tags?: Record<string, string>; // Tags from the original PGN
  startingFEN?: string;
}

// Interface for the objects expected in the array passed to generateVariationKey
export interface MoveForVariationKey {
  move: string;
  // Allow other properties to exist on the object, but they won't be used for the key.
  [key: string]: any;
}
