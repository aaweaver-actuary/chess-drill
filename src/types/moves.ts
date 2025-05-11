import { Option, Some, None } from 'ts-results';

/**
 * Represents a chess move in algebraic notation as a string.
 * 
 * Examples:
 * - "e4" for a pawn move to e4
 * - "Nf3" for a knight move to f3
 * - "O-O" for kingside castling
 */
export type Move = string;

/**
 * Represents a collection of chess moves and provides utility methods
 * to access and retrieve moves from the collection.
 *
 * @remarks
 * This class encapsulates an array of `Move` objects and offers methods
 * to retrieve all moves or a specific move by index, safely handling out-of-bounds access.
 *
 * @example
 * ```typescript
 * const moves = new Moves([move1, move2]);
 * const allMoves = moves.getMoves();
 * const firstMove = moves.get(0);
 * ```
 */
export class Moves {
  private moves: Move[];

  constructor(moves: Move[]) {
    this.moves = moves;
  }

  public getMoves(): Move[] {
    return this.moves;
  }

  public get(index: number): Option<Move> {
    if (index >= 0 && index < this.moves.length) {
      return Some(this.moves[index]);
    } else {
      return None;
    }
  }
}
