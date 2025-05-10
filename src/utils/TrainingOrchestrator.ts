import { PgnDataManager } from '@/utils/PgnDataManager';
import { ChessEngine } from '@/utils/ChessEngine';
import { StatsStore } from '@/utils/StatsStore';
import { ChessPieceColor } from '@/_enums/ChessPieceColor';
import { DrillSession } from '@/utils/DrillSession';
import {
  ParsedPgn,
  PgnMove,
  VariationLine,
  MoveForVariationKey,
} from '@/types/pgnTypes';
import { ChessSquare } from '@/_enums/ChessSquare';
import { PromotionPiece } from '@/_enums/ChessPiece';

export class TrainingOrchestrator {
  private pgnDataManager: PgnDataManager;
  private _engine: ChessEngine | null = null; // Retained for now, though DrillSession has its own
  private statsStore: StatsStore;
  private _drillSession: DrillSession | null = null;
  private _currentVariation: VariationLine | null = null;

  constructor() {
    this.pgnDataManager = new PgnDataManager();
    this._engine = new ChessEngine();
    this.statsStore = new StatsStore();
  }

  public loadPgn(pgnString: string): void {
    if (!pgnString) {
      throw new Error('PGN string cannot be empty.');
    }
    this.pgnDataManager.loadPgn(pgnString);
    if (
      !this.pgnDataManager.hasPgnLoaded() ||
      !this.pgnDataManager.getParsedPgn()
    ) {
      // Handle cases where PGN might be invalid and not properly parsed by PgnDataManager
      // This check ensures that subsequent operations don't assume a valid parsedPgn state
      // console.warn("PGN loaded but data might be invalid or empty.");
    }
  }

  public getParsedPgn(): ParsedPgn | null {
    return this.pgnDataManager.getParsedPgn();
  }

  public hasPgnLoaded(): boolean {
    return this.pgnDataManager.hasPgnLoaded();
  }

  public generateVariationKey(variationMoves: MoveForVariationKey[]): string {
    return this.pgnDataManager.generateVariationKey(variationMoves);
  }

  public getCurrentVariation(): VariationLine | undefined {
    return this._drillSession?.getVariation();
  }

  public getCurrentVariationKey(): string {
    const currentVariation = this._drillSession?.getVariation();
    if (!currentVariation) return '';
    // Map moves to { move: string } for compatibility with MoveForVariationKey
    return this.pgnDataManager.generateVariationKey(
      currentVariation.moves.map((m) => ({ move: String(m.move) })),
    );
  }

  /**
   * Determines if the user plays White or Black based on the first move of the variation.
   * For MVP: if move starts with '...', user is Black; otherwise, user is White.
  public determineUserColor(variation: VariationLine): ChessPieceColor | undefined {
    if (!variation.moves || variation.moves.length === 0) return undefined;
    const firstMove = variation.moves[0];

    // Check if the PGN move number indicates Black's move (e.g., "1... e5")
    // or if the move itself is a Black move SAN (e.g. starts with a number then '...')
    // A more robust way would be to check the FEN before this move if available,
    // or rely on the PGN parser to correctly identify turns.
    // For now, a simple check on the SAN string.
    if (firstMove.move_number && firstMove.turn === 'b') {
      // Assuming pgn-parser provides turn info
      return 'b';
    }
    // Fallback for simple PGNs or parsers not providing turn
    if (
      typeof firstMove.move === 'string' &&
      (firstMove.move as string).includes &&
      (firstMove.move as string).includes('...')
    ) {
      return 'b'; // User plays Black
    }
    return 'w'; // User plays White
  }
  }

  /**
   * Selects a random variation from the provided array.
   * Returns undefined if the array is empty.
   */
  public selectRandomVariation(
    flatVariations: VariationLine[],
  ): VariationLine | undefined {
    if (!flatVariations || flatVariations.length === 0) return undefined;
    if (flatVariations.length === 1) return flatVariations[0];
    const idx = Math.floor(Math.random() * flatVariations.length);
    return flatVariations[idx];
  }

  /**
   * Flattens a parsed PGN structure with nested variations (RAVs) into a list of distinct playable lines.
   *
   * @param pgnData The parsed PGN data to flatten. If null, returns an empty array.
   * @returns An array of VariationLine objects, each representing a complete playable variation.
   */
  public flattenVariations(pgnData: ParsedPgn | null): VariationLine[] {
    return this.pgnDataManager.flattenVariations(pgnData); // Delegated
  }
  public startTrainingSession(userPlaysAs?: ChessPieceColor): void {
    if (!this.pgnDataManager.hasPgnLoaded()) {
      throw new Error('PGN not loaded. Cannot start training session.');
    }
    const parsedPgn = this.pgnDataManager.getParsedPgn();
    if (!parsedPgn) {
      throw new Error(
        'PGN data is null despite PGN being loaded. Cannot start training session.',
      );
    }

    const flatVariations = this.pgnDataManager.flattenVariations(parsedPgn);
    if (flatVariations.length === 0) {
      throw new Error(
        'No variations found in PGN. Cannot start training session.',
      );
    }

    const selectedVariation = this.selectRandomVariation(flatVariations);
    if (!selectedVariation) {
      // Should not happen if flatVariations is not empty
      throw new Error('Failed to select a variation.');
    }

    const determinedUserColor =
      userPlaysAs || this.determineUserColor(selectedVariation);
    if (!determinedUserColor) {
      throw new Error(
        'Could not determine user color for the selected variation.',
      );
    }

    // Initialize the DrillSession
    this._drillSession = new DrillSession(
      selectedVariation,
      determinedUserColor,
      selectedVariation.startingFEN,
    );

    // TODO: Auto-play opponent moves if it's not the user's turn initially.
    // This logic might need to be in DrillSession's constructor or a method called here.
    // For now, we assume the drill starts and waits for the user if it's their turn,
    // or the UI/DrillSession handles the first opponent move.
    // Example:
    // if (this._drillSession && !this._drillSession.isUserTurn()) {
    //   this._drillSession.playOpponentMoveIfApplicable(); // A hypothetical method
    // }
  }
  determineUserColor(
    selectedVariation: VariationLine,
  ): ChessPieceColor | undefined {
    throw new Error('Method not implemented.');
  }

  public getCurrentFen(): string | undefined {
    return this._drillSession?.getCurrentFen();
  }

  public getExpectedMoveForCurrentUser(): PgnMove | undefined {
    const move = this._drillSession?.getExpectedMove();
    return move === null ? undefined : move;
  }

  public isUserTurn(): boolean {
    return this._drillSession ? this._drillSession.isUserTurn() : false;
  }

  public handleUserMove(moveInput: {
    from: ChessSquare;
    to: ChessSquare;
    promotion: PromotionPiece;
  }): {
    isValid: boolean; // Changed from success to isValid for clarity with DrillSession
    isCorrectMove: boolean; // Added
    isVariationComplete?: boolean;
    nextFen?: string;
    opponentMove?: PgnMove | null;
    expectedMoveSan?: string; // Changed from expectedMove to expectedMoveSan for clarity
  } {
    if (!this._drillSession) {
      throw new Error('No active training session. Start a session first.');
    }

    // Note: isUserTurn check is implicitly handled by DrillSession.handleUserMove
    // or should be checked by the UI before calling this.
    // If we want to enforce it here:
    // if (!this._drillSession.isUserTurn()) {
    //   throw new Error("It is not the user's turn.");
    // }

    const expectedMoveBeforeUserAction = this._drillSession.getExpectedMove();

    const result = this._drillSession.handleUserMove(moveInput);

    if (result.success && result.isCorrectMove) {
      this.statsStore.recordResult(this.getCurrentVariationKey(), true);
    } else if (result.success && !result.isCorrectMove) {
      // User made a valid board move, but it was not the correct one for the drill
      this.statsStore.recordResult(this.getCurrentVariationKey(), false);
    }
    // If result.success is false, it means the move was illegal or an engine error occurred.
    // Stats are not recorded for illegal moves by default, but this could be a design choice.

    return {
      isValid: result.success,
      isCorrectMove: result.isCorrectMove,
      isVariationComplete: result.isComplete,
      nextFen: result.newFen,
      opponentMove: result.opponentMove,
      expectedMoveSan: expectedMoveBeforeUserAction?.move
        ? String(expectedMoveBeforeUserAction.move)
        : undefined, // Return the SAN of the move that was expected
    };
  }

  public isDrillComplete(): boolean {
    return this._drillSession ? this._drillSession.isDrillComplete() : false;
  }

  public getVariationPlayCount(variationKey: string): number {
    if (this.statsStore && typeof this.statsStore.getStats === 'function') {
      const stats = this.statsStore.getStats(variationKey);
      return stats ? stats.attempts : 0;
    }
    return 0;
  }

  public getVariationSuccessRate(variationKey: string): number {
    if (this.statsStore && typeof this.statsStore.getStats === 'function') {
      const stats = this.statsStore.getStats(variationKey);
      if (stats && stats.attempts > 0) {
        return stats.successes / stats.attempts;
      }
    }
    return 0;
  }
}
