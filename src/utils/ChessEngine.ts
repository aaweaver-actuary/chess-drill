import { Chess } from 'chess.js';

/**
 * @interface IChessEngine
 * @method loadPgn
 * @method makeMove
 * @method reset
 */

/**
 * ChessEngine wraps chess.js to provide a clean interface.
 */
export class ChessEngine {
  game: Chess;
  constructor() {
    /** @private */
    this.game = new Chess();
  }

  /**
   * Load a full PGN string into the engine.
   * @param {string} pgn - PGN text.
   * @returns {boolean} True if parsed successfully.
   */
  loadPgn(pgn: string) {
    return this.game.loadPgn(
      pgn,
      { sloppy: true } as any // TODO: Add interface for "LoadPgnOptions" with sloppy, string, newLineChar
    );
  }

  /**
   * Attempt a move in SAN or {from,to} format.
   * @param {string|object} move - SAN string or move object.
   * @returns {object|null} The move object if legal, else null.
   */
  makeMove(move: string | { from: string; to: string; promotion?: string; }) {
    return this.game.move(move) || null;
  }

  /**
   * Get the current move history in verbose form.
   * @returns {Array<object>}
   */
  getHistory() {
    return this.game.history({ verbose: true });
  }

  /**
   * Reset the game to initial position.
   */
  reset() {
    this.game.reset();
  }
}