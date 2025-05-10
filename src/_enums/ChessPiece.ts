/**
 * Represents the different types of chess pieces.
 *
 * Each chess piece is mapped to its corresponding lowercase character notation:
 * - Pawn: 'p'
 * - Knight: 'n'
 * - Bishop: 'b'
 * - Rook: 'r'
 * - Queen: 'q'
 * - King: 'k'
 */
export enum ChessPiece {
  Pawn = 'p',
  Knight = 'n',
  Bishop = 'b',
  Rook = 'r',
  Queen = 'q',
  King = 'k'
}

export const ChessPieceFromString: Record<string, ChessPiece> = {
  p: ChessPiece.Pawn,
  n: ChessPiece.Knight,
  b: ChessPiece.Bishop,
  r: ChessPiece.Rook,
  q: ChessPiece.Queen,
  k: ChessPiece.King
};

/**
 * Enum representing the possible chess pieces a pawn can be promoted to.
 *
 * - `No Promotion` ('x'): Indicates no promotion.
 * - `Knight` ('n')
 * - `Bishop` ('b')
 * - `Rook` ('r')
 * - `Queen` ('q')
 *
 * Used to specify the desired piece during pawn promotion in chess.
 */
export enum PromotionPiece {
  NoPromotion = 'x',
  Knight = 'n',
  Bishop = 'b',
  Rook = 'r',
  Queen = 'q'
}