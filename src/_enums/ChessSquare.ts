/**
 * Represents the 64 squares on a standard chessboard.
 * 
 * Each square is identified by its algebraic notation (e.g., A1, E4, H8) and mapped to a unique numeric value from 0 to 63.
 * The numbering starts from A1 (0) at the bottom-left and increases left-to-right, bottom-to-top (A1, A2, ..., H8).
 * 
 * This enum can be used for indexing, board representation, and move calculations in chess-related applications.
 */
export enum ChessSquare {
  A1 = 0,
  A2 = 1,
  A3 = 2,
  A4 = 3,
  A5 = 4,
  A6 = 5,
  A7 = 6,
  A8 = 7,
  B1 = 8,
  B2 = 9,
  B3 = 10,
  B4 = 11,
  B5 = 12,
  B6 = 13,
  B7 = 14,
  B8 = 15,
  C1 = 16,
  C2 = 17,
  C3 = 18,
  C4 = 19,
  C5 = 20,
  C6 = 21,
  C7 = 22,
  C8 = 23,
  D1 = 24,
  D2 = 25,
  D3 = 26,
  D4 = 27,
  D5 = 28,
  D6 = 29,
  D7 = 30,
  D8 = 31,
  E1 = 32,
  E2 = 33,
  E3 = 34,
  E4 = 35,
  E5 = 36,
  E6 = 37,
  E7 = 38,
  E8 = 39,
  F1 = 40,
  F2 = 41,
  F3 = 42,
  F4 = 43,
  F5 = 44,
  F6 = 45,
  F7 = 46,
  F8 = 47,
  G1 = 48,
  G2 = 49,
  G3 = 50,
  G4 = 51,
  G5 = 52,
  G6 = 53,
  G7 = 54,
  G8 = 55,
  H1 = 56,
  H2 = 57,
  H3 = 58,
  H4 = 59,
  H5 = 60,
  H6 = 61,
  H7 = 62,
  H8 = 63
}

/**
 * Maps string representations of chessboard squares (e.g., "a1", "e4") to their corresponding `ChessSquare` enum values.
 *
 * This mapping allows for easy conversion from algebraic notation strings to the strongly-typed `ChessSquare` enum.
 *
 * @example
 * ```typescript
 * const square = ChessSquareFromString["e4"]; // ChessSquare.E4
 * ```
 */
export const ChessSquareFromString: Record<string, ChessSquare> = {
  a1: ChessSquare.A1,
  a2: ChessSquare.A2,
  a3: ChessSquare.A3,
  a4: ChessSquare.A4,
  a5: ChessSquare.A5,
  a6: ChessSquare.A6,
  a7: ChessSquare.A7,
  a8: ChessSquare.A8,
  b1: ChessSquare.B1,
  b2: ChessSquare.B2,
  b3: ChessSquare.B3,
  b4: ChessSquare.B4,
  b5: ChessSquare.B5,
  b6: ChessSquare.B6,
  b7: ChessSquare.B7,
  b8: ChessSquare.B8,
  c1: ChessSquare.C1,
  c2: ChessSquare.C2,
  c3: ChessSquare.C3,
  c4: ChessSquare.C4,
  c5: ChessSquare.C5,
  c6: ChessSquare.C6,
  c7: ChessSquare.C7,
  c8: ChessSquare.C8,
  d1: ChessSquare.D1,
  d2: ChessSquare.D2,
  d3: ChessSquare.D3,
  d4: ChessSquare.D4,
  d5: ChessSquare.D5,
  d6: ChessSquare.D6,
  d7: ChessSquare.D7,
  d8: ChessSquare.D8,
  e1: ChessSquare.E1,
  e2: ChessSquare.E2,
  e3: ChessSquare.E3,
  e4: ChessSquare.E4,
  e5: ChessSquare.E5,
  e6: ChessSquare.E6,
  e7: ChessSquare.E7,
  e8: ChessSquare.E8,
  f1: ChessSquare.F1,
  f2: ChessSquare.F2,
  f3: ChessSquare.F3,
  f4: ChessSquare.F4,
  f5: ChessSquare.F5,
  f6: ChessSquare.F6,
  f7: ChessSquare.F7,
  f8: ChessSquare.F8,
  g1: ChessSquare.G1,
  g2: ChessSquare.G2,
  g3: ChessSquare.G3,
  g4: ChessSquare.G4,
  g5: ChessSquare.G5,
  g6: ChessSquare.G6,
  g7: ChessSquare.G7,
  g8: ChessSquare.G8,
  h1: ChessSquare.H1,
  h2: ChessSquare.H2,
  h3: ChessSquare.H3,
  h4: ChessSquare.H4,
  h5: ChessSquare.H5,
  h6: ChessSquare.H6,
  h7: ChessSquare.H7,
  h8: ChessSquare.H8
};

