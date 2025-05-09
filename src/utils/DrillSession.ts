// src/utils/DrillSession.ts
import { ChessEngine } from './ChessEngine';
import { VariationLine, PgnMove } from '@/types/pgnTypes';
import { DrillStateManager } from './DrillStateManager';

export class DrillSession {
  private chessEngine: ChessEngine;
  private variation: VariationLine;
  private userColor: 'w' | 'b';
  public stateManager: DrillStateManager; // Exposed for test

  constructor(
    variation: VariationLine,
    userColor: 'w' | 'b',
    initialFen?: string,
  ) {
    this.chessEngine = new ChessEngine();
    this.variation = variation;
    this.userColor = userColor;
    this.stateManager = new DrillStateManager(variation.moves);

    if (initialFen) {
      this.chessEngine.load(initialFen);
    } else {
      this.chessEngine.reset(); // Start from the standard initial position if no FEN is provided
    }
    // TODO: Advance to the actual starting position of the drill if the variation doesn't start from move 1
    // TODO: Auto-play opponent moves if it's not the user's turn initially
  }

  public getCurrentFen(): string {
    return this.chessEngine.game.fen();
  }

  public isUserTurn(): boolean {
    if (this.stateManager.isComplete()) {
      return false; // Drill is complete
    }
    const engineTurn = this.chessEngine.game.turn();
    return engineTurn === this.userColor;
  }

  public getExpectedMove(): PgnMove | null {
    if (!this.isUserTurn() || this.stateManager.isComplete()) {
      return null;
    }
    return this.stateManager.getExpectedMove();
  }

  public handleUserMove(moveInput: {
    from: string;
    to: string;
    promotion?: string;
  }): {
    success: boolean;
    isCorrectMove: boolean;
    newFen: string;
    opponentMove?: PgnMove | null;
    isComplete: boolean;
  } {
    if (!this.isUserTurn()) {
      // This should ideally be prevented by UI or higher-level logic
      return {
        success: false,
        isCorrectMove: false,
        newFen: this.getCurrentFen(),
        isComplete: this.isDrillComplete(),
      };
    }

    const expectedMove = this.getExpectedMove();
    if (!expectedMove) {
      // Should not happen if isUserTurn is true and drill not complete
      return {
        success: false,
        isCorrectMove: false,
        newFen: this.getCurrentFen(),
        isComplete: this.isDrillComplete(),
      };
    }

    // TODO: More robust SAN comparison or from/to comparison
    const isCorrect =
      (expectedMove.from === moveInput.from &&
        expectedMove.to === moveInput.to) ||
      expectedMove.move === this.chessEngine.moveToSan?.(moveInput); // Requires moveToSan method

    if (!isCorrect) {
      return {
        success: true,
        isCorrectMove: false,
        newFen: this.getCurrentFen(),
        isComplete: false,
      };
    }

    const moveResult = this.chessEngine.makeMove(moveInput);
    if (!moveResult) {
      // This implies an illegal move despite our check, or an engine issue.
      // This could happen if the `isCorrect` check above is not perfectly aligned with engine's legality.
      console.error(
        'DrillSession: Engine rejected a move that was deemed correct.',
        moveInput,
        expectedMove,
      );
      return {
        success: false,
        isCorrectMove: false,
        newFen: this.getCurrentFen(),
        isComplete: this.isDrillComplete(),
      };
    }

    this.stateManager.advance();
    let opponentMovePlayed: PgnMove | null = null;

    // Check if drill is complete after user's move
    if (this.stateManager.isComplete()) {
      return {
        success: true,
        isCorrectMove: true,
        newFen: this.getCurrentFen(),
        isComplete: true,
      };
    }

    // If not complete, and it's now opponent's turn, play opponent's move
    if (!this.isUserTurn() && !this.stateManager.isComplete()) {
      const opponentPgnMove = this.stateManager.getExpectedMove();
      const opponentMoveForEngine =
        opponentPgnMove.from && opponentPgnMove.to
          ? {
              from: opponentPgnMove.from,
              to: opponentPgnMove.to,
              promotion: opponentPgnMove.promotion,
            }
          : opponentPgnMove.move;

      const opponentMoveResult = this.chessEngine.makeMove(
        opponentMoveForEngine,
      );
      if (opponentMoveResult) {
        opponentMovePlayed = opponentPgnMove;
        this.stateManager.advance();
      } else {
        // This is a critical error: the variation's scripted opponent move is illegal.
        console.error(
          "CRITICAL: Opponent's move from variation is illegal.",
          opponentPgnMove,
          this.getCurrentFen(),
        );
        // The drill might be considered stuck or ended here due to bad PGN data.
        // For now, we'll return the state after the user's successful move.
        return {
          success: true,
          isCorrectMove: true,
          newFen: this.chessEngine.game.fen(),
          opponentMove: null,
          isComplete: this.isDrillComplete(),
        };
      }
    }

    return {
      success: true,
      isCorrectMove: true,
      newFen: this.getCurrentFen(),
      opponentMove: opponentMovePlayed,
      isComplete: this.isDrillComplete(),
    };
  }

  public isDrillComplete(): boolean {
    return this.stateManager.isComplete();
  }

  // New getter methods
  public getVariation(): VariationLine {
    return this.variation;
  }

  public getUserColor(): 'w' | 'b' {
    return this.userColor;
  }

  // Placeholder for a method that might be needed in ChessEngine or here
  // This is a simplification; chess.js's move function returns a move object that includes SAN
  private _moveToSan(moveInput: {
    from: string;
    to: string;
    promotion?: string;
  }): string | null {
    // This would require chess.js instance to try the move and get its SAN string.
    // const tempGame = new Chess(this.chessEngine.game.fen());
    // const moveResult = tempGame.move(moveInput);
    // return moveResult ? moveResult.san : null;
    return `${moveInput.from}-${moveInput.to}`; // Simplified placeholder
  }
}
