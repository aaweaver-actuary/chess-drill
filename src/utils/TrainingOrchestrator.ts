import { VariationParser } from './VariationParser';
import { ChessEngine } from './ChessEngine'; // Added import
import { StatsStore } from './StatsStore'; // Added import

// Define a type for parsed PGN moves, including recursive RAVs
export interface PgnMove {
  move: string; // SAN string for the move
  from?: string; // Starting square, e.g., 'e2'
  to?: string; // Ending square, e.g., 'e4'
  promotion?: 'q' | 'r' | 'b' | 'n'; // Promotion piece
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
  startingFEN?: string; // Added
  // Other properties that might be present in parsed PGN
}

// Structure for flattened variation lines
export interface VariationLine {
  moves: PgnMove[]; // Without 'rav' properties
  tags?: Record<string, string>; // Tags from the original PGN
  startingFEN?: string; // Added
}

// Interface for the objects expected in the array passed to generateVariationKey
interface MoveForVariationKey {
  move: string;
  // Allow other properties to exist on the object, but they won't be used for the key.
  [key: string]: any;
}

export class TrainingOrchestrator {
  private variationParser: VariationParser;
  private parsedPgn: ParsedPgn | null = null;
  private _engine: ChessEngine | null = null; // Added property
  private _currentVariation: VariationLine | null = null; // Added property
  private _userColor: 'w' | 'b' | null = null; // Added property
  private _currentMoveIndex: number = 0; // Added property, to track progress within the variation
  public statsStore: StatsStore; // Added property, made public as per checklist for future UI integration

  constructor() {
    this.variationParser = new VariationParser();
    this._engine = new ChessEngine(); // Initialize ChessEngine
    this.statsStore = new StatsStore(); // Initialize StatsStore
    // _currentVariation, _userColor, _currentMoveIndex have default initial values
  }

  public loadPgn(pgnString: string): void {
    if (!pgnString) {
      throw new Error('PGN string cannot be empty.');
    }
    this.parsedPgn = this.variationParser.parse(pgnString);
    // TODO: Add more robust error handling if parse can fail
  }

  public getParsedPgn(): ParsedPgn | null {
    return this.parsedPgn;
  }

  public hasPgnLoaded(): boolean {
    return this.parsedPgn !== null;
  }

  public generateVariationKey(variationMoves: MoveForVariationKey[]): string {
    if (!variationMoves || variationMoves.length === 0) {
      return '';
    }
    // Create the key by joining only the 'move' property of each object
    return variationMoves.map((m) => m.move).join('_');
  }

  public getCurrentVariation(): VariationLine | undefined {
    return this._currentVariation;
  }

  public getCurrentVariationKey(): string {
    if (!this._currentVariation) return '';
    return this.generateVariationKey(this._currentVariation.moves);
  }

  /**
   * Determines if the user plays White or Black based on the first move of the variation.
   * For MVP: if move starts with '...', user is Black; otherwise, user is White.
   */
  public determineUserColor(variation: VariationLine): 'w' | 'b' | undefined {
    if (!variation.moves || variation.moves.length === 0) return undefined;
    // For MVP: if move starts with '...', user is Black; otherwise, user is White.
    const firstMove = variation.moves[0].move;
    if (firstMove.includes('...')) {
      return 'b'; // User plays Black
    }
    return 'w'; // User plays White
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
    if (!pgnData || !pgnData.moves || pgnData.moves.length === 0) {
      return [];
    }

    const flatVariations: VariationLine[] = [];
    const tags = pgnData.tags;
    const startingFEN = pgnData.startingFEN; // Capture startingFEN from pgnData

    // Helper function to create a deep copy of a move without rav property
    const copyMoveWithoutRav = (move: PgnMove): PgnMove => {
      const { rav, ...moveCopy } = move;
      return moveCopy;
    };

    // DFS function to build all possible variation lines
    const buildVariations = (currentPath: PgnMove[], movesArray: PgnMove[]) => {
      if (movesArray.length === 0) {
        return;
      }

      let currentLine = [...currentPath];

      // Process each move in the current sequence
      for (let i = 0; i < movesArray.length; i++) {
        const move = movesArray[i];

        // First, process any RAVs (alternative variations) from this position
        if (move.rav && move.rav.length > 0) {
          // For each RAV, start a new variation from the current path
          for (const rav of move.rav) {
            if (rav.moves && rav.moves.length > 0) {
              buildVariations(currentLine, rav.moves);
            }
          }
        }

        // Add the current move to our path (without its RAVs)
        currentLine.push(copyMoveWithoutRav(move));

        // If this is the last move in the sequence, add the completed line to our results
        if (i === movesArray.length - 1) {
          flatVariations.push({
            moves: [...currentLine],
            tags,
            startingFEN, // Added startingFEN here
          });
        }
      }
    };

    // Start building variations from the root moves
    buildVariations([], pgnData.moves);

    return flatVariations;
  }

  public startTrainingSession(userPlaysAs?: 'w' | 'b'): void {
    if (!this.hasPgnLoaded() || !this.parsedPgn) {
      // Added !this.parsedPgn check for type safety
      throw new Error('PGN not loaded. Cannot start training session.');
    }
    const flatVariations = this.flattenVariations(this.parsedPgn);
    if (flatVariations.length === 0) {
      throw new Error(
        'No variations found in PGN. Cannot start training session.',
      );
    }
    // Further implementation will follow based on TDD...
  }

  public getCurrentFen(): string | undefined {
    if (!this._engine || !this._engine.game || !this._currentVariation) {
      // Added check for _currentVariation
      return undefined;
    }
    return this._engine.game.fen();
  }

  public getExpectedMoveForCurrentUser(): PgnMove | undefined {
    if (!this._currentVariation || !this._engine || !this._userColor)
      return undefined;
    const history = this._engine.getHistory ? this._engine.getHistory() : [];
    // Determine whose turn it is: even index = White, odd = Black
    for (let i = history.length; i < this._currentVariation.moves.length; i++) {
      const moveColor = i % 2 === 0 ? 'w' : 'b';
      if (moveColor === this._userColor) {
        return this._currentVariation.moves[i];
      }
    }
    return undefined;
  }

  public isUserTurn(): boolean {
    if (!this._currentVariation || !this._engine || !this._userColor)
      return false;
    const history = this._engine.getHistory ? this._engine.getHistory() : [];
    const moveIdx = history.length;
    const moveColor = moveIdx % 2 === 0 ? 'w' : 'b';
    return (
      moveColor === this._userColor &&
      moveIdx < this._currentVariation.moves.length
    );
  }

  public handleUserMove(moveInput: {
    from: string;
    to: string;
    promotion?: string;
  }): {
    isValid: boolean;
    isVariationComplete?: boolean;
    nextFen?: string;
    opponentMove?: PgnMove | null;
    expectedMove?: PgnMove;
  } {
    if (!this._currentVariation || !this._engine) {
      throw new Error('No active training session.');
    }
    if (!this.isUserTurn()) {
      throw new Error("It is not the user's turn.");
    }

    const expectedMoveDefinition = this.getExpectedMoveForCurrentUser();
    if (!expectedMoveDefinition) {
      // This case should ideally be caught by isUserTurn or session state
      throw new Error(
        'Could not determine expected move for current user, or variation already complete.',
      );
    }

    // Basic validation: compare from/to and promotion if applicable
    // A more robust validation might involve converting moveInput to SAN and comparing with expectedMoveDefinition.move
    const isCorrectMove =
      expectedMoveDefinition.from === moveInput.from &&
      expectedMoveDefinition.to === moveInput.to &&
      (expectedMoveDefinition.promotion || undefined) ===
        (moveInput.promotion || undefined);

    if (!isCorrectMove) {
      if (this.statsStore) {
        this.statsStore.recordResult(this.getCurrentVariationKey(), false);
      }
      return {
        isValid: false,
        expectedMove: expectedMoveDefinition,
      };
    }

    // User's move is correct, make it on the engine
    const userMoveMade = this._engine.makeMove(moveInput);
    if (!userMoveMade) {
      // This should not happen if isCorrectMove passed and engine is in sync
      console.error(
        "Internal error: Engine failed to make a validated user's move.",
        moveInput,
        this._engine.game.fen(),
      );
      // Potentially revert stats or throw, for now, treat as unexpected error path
      throw new Error(
        "Internal error: Engine failed to make validated user's move.",
      );
    }

    if (this.statsStore) {
      this.statsStore.recordResult(this.getCurrentVariationKey(), true);
    }

    let currentFenAfterUserAction = this._engine.game.fen();
    let opponentPlayedPgnMove: PgnMove | null = null;

    const historyAfterUserMove = this._engine.getHistory();
    const movesPlayedCountAfterUserMove = historyAfterUserMove.length;
    let isVariationNowComplete =
      movesPlayedCountAfterUserMove === this._currentVariation.moves.length;

    // If the variation is not complete after the user's move, try to play the opponent's move
    if (!isVariationNowComplete) {
      const opponentPgnMoveDefinition =
        this._currentVariation.moves[movesPlayedCountAfterUserMove];

      if (opponentPgnMoveDefinition) {
        const opponentMoveForEngineInput =
          opponentPgnMoveDefinition.from && opponentPgnMoveDefinition.to
            ? {
                from: opponentPgnMoveDefinition.from,
                to: opponentPgnMoveDefinition.to,
                promotion: opponentPgnMoveDefinition.promotion,
              }
            : opponentPgnMoveDefinition.move; // Fallback to SAN string if from/to not present

        const opponentEngineMoveResult = this._engine.makeMove(
          opponentMoveForEngineInput,
        );

        if (opponentEngineMoveResult) {
          opponentPlayedPgnMove = opponentPgnMoveDefinition; // Store the PGN definition of the opponent's move
          currentFenAfterUserAction = this._engine.game.fen(); // Update FEN to after opponent's move
          // Re-check if variation is complete after opponent's move
          isVariationNowComplete =
            this._engine.getHistory().length ===
            this._currentVariation.moves.length;
        } else {
          // This indicates an issue with the PGN or engine state, as a defined variation move was illegal
          console.error(
            "CRITICAL: Opponent's move from PGN variation is illegal on current board.",
            {
              variationMoveAttempted: opponentPgnMoveDefinition,
              boardFen: this._engine.game.fen(), // FEN before attempting opponent's move (which is after user's move)
              historySAN: this._engine.getHistory().map((h) => h.san),
              currentVariationMovesSAN: this._currentVariation.moves.map(
                (m) => m.move,
              ),
            },
          );
          // Variation effectively ends here if opponent's scripted move is unplayable
          // isVariationNowComplete remains as it was after the user's move
        }
      }
    }

    return {
      isValid: true,
      isVariationComplete: isVariationNowComplete,
      nextFen: currentFenAfterUserAction,
      opponentMove: opponentPlayedPgnMove,
    };
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
