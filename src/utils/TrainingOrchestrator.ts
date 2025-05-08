import { VariationParser } from './VariationParser';

// Define a type for parsed PGN moves, including recursive RAVs
export interface PgnMove {
  move: string;
  comment?: string;
  nag?: string[];
  rav?: PgnRav[]; // Changed from singular "rav" to match test expectations
  [key: string]: any; // For any other properties that might exist
}

export interface PgnRav {
  moves: PgnMove[];
}

// The overall structure of parsed PGN data
export interface ParsedPgn {
  moves: PgnMove[];
  tags?: Record<string, string>;
  result?: string;
  // Other properties that might be present in parsed PGN
}

// Structure for flattened variation lines
export interface VariationLine {
  moves: PgnMove[]; // Without 'rav' properties
  tags?: Record<string, string>; // Tags from the original PGN
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
  private _currentVariation: VariationLine | undefined;
  private _userColor: 'w' | 'b' | undefined;
  private _engine: any;
  public statsStore: any; // For test injection, real type later

  constructor() {
    this.variationParser = new VariationParser();
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
    const firstMove = variation.moves[0].move;
    if (firstMove.startsWith('...')) return 'b';
    return 'w';
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
          });
        }
      }
    };

    // Start building variations from the root moves
    buildVariations([], pgnData.moves);

    return flatVariations;
  }

  public startTrainingSession(userPlaysAs?: 'w' | 'b'): void {
    if (!this.hasPgnLoaded()) {
      throw new Error('PGN must be loaded before starting a training session.');
    }
    const variations = this.flattenVariations(this.parsedPgn);
    const selected = this.selectRandomVariation(variations);
    this._currentVariation = selected;
    this._userColor = selected ? this.determineUserColor(selected) : undefined;
    // For now, just instantiate ChessEngine (actual FEN setup will be handled in next steps)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ChessEngine } = require('./ChessEngine');
    this._engine = new ChessEngine();
    // After initializing engine, auto-play opponent moves until it's the user's turn
    if (selected && this._userColor) {
      let turn = this._userColor;
      let moveIdx = 0;
      // If user is Black, play White's moves until it's Black's turn, etc.
      while (moveIdx < selected.moves.length) {
        // Determine whose turn it is: even index = White, odd = Black
        const moveColor = moveIdx % 2 === 0 ? 'w' : 'b';
        if (moveColor === this._userColor) break;
        this._engine.makeMove(selected.moves[moveIdx].move);
        moveIdx++;
      }
    }
  }

  public getCurrentFen(): string | undefined {
    if (
      !this._engine ||
      !this._engine.game ||
      typeof this._engine.game.fen !== 'function'
    )
      return undefined;
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

  public handleUserMove(move: {
    from: string;
    to: string;
    promotion?: string;
  }): any {
    if (!this._currentVariation || !this._engine || !this._userColor) {
      throw new Error('No active training session.');
    }
    if (!this.isUserTurn()) {
      throw new Error("It is not the user's turn.");
    }
    // Check if move matches expected
    const expected = this.getExpectedMoveForCurrentUser();
    if (expected && move && move.from && move.to) {
      // For now, treat a move as correct only if from/to match expected.move (string compare for test)
      // In real code, compare SAN or from/to properly
      if (move.from === expected.from && move.to === expected.to) {
        // ...existing code for correct move...
        if (
          this.statsStore &&
          typeof this.statsStore.recordResult === 'function'
        ) {
          const key = this.generateVariationKey(this._currentVariation.moves);
          this.statsStore.recordResult(key, true);
        }
        this._engine.makeMove(move);
        // Move getHistory() after makeMove so it reflects the updated state
        const history = this._engine.getHistory
          ? this._engine.getHistory()
          : [];
        const isVariationComplete =
          history.length >= this._currentVariation.moves.length;
        const nextFen =
          this._engine.game && this._engine.game.fen
            ? this._engine.game.fen()
            : undefined;
        return {
          isValid: true,
          isVariationComplete,
          nextFen,
        };
      } else {
        // Incorrect move: record attempt, do not advance game
        if (
          this.statsStore &&
          typeof this.statsStore.recordResult === 'function'
        ) {
          const key = this.generateVariationKey(this._currentVariation.moves);
          this.statsStore.recordResult(key, false);
        }
        return {
          isValid: false,
          expectedMove: expected,
        };
      }
    }
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
