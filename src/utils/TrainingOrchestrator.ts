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
}
