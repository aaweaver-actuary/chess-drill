// src/utils/PgnDataManager.ts
import { VariationParser } from './VariationParser';
import {
  ParsedPgn,
  VariationLine,
  PgnMove,
  MoveForVariationKey,
  Variation,
} from '@/types/pgnTypes';

export class PgnDataManager {
  private variationParser: VariationParser;
  private parsedPgn: ParsedPgn | null = null;
  private pgnString: string | null = null;

  constructor(pgnString?: string) {
    this.variationParser = new VariationParser();
    if (pgnString) {
      this.loadPgn(pgnString);
    }
  }

  public loadPgn(pgnString: string): void {
    if (!pgnString) {
      this.parsedPgn = null;
      this.pgnString = null;
      return;
    }
    // TODO: Add try-catch for parsing errors
    this.parsedPgn = this.variationParser.parse(pgnString) as ParsedPgn;
    this.pgnString = pgnString;
    console.log('PGN Data Loaded:', this.pgnString);
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
    return variationMoves.map((m) => m.move).join('_');
  }

  public flattenVariations(pgnData: ParsedPgn | null): VariationLine[] {
    if (!pgnData || !pgnData.moves) {
      return [];
    }

    const flatVariations: VariationLine[] = [];
    const startingFEN = pgnData.tags?.FEN || pgnData.startingFEN; // Use FEN from tags if available

    const recurse = (currentMoves: PgnMove[], accumulatedLine: PgnMove[]) => {
      for (let i = 0; i < currentMoves.length; i++) {
        const move = { ...currentMoves[i] };
        const currentLineContinuation = [...accumulatedLine, move];

        // Remove 'rav' from the move copy for the flattened line
        delete move.rav;

        if (move.rav && move.rav.length > 0) {
          // Process main line first
          const mainLineContinuation = [...currentLineContinuation];
          if (i + 1 < currentMoves.length) {
            // If there are more moves after the current one in the main sequence,
            // continue recursion for the rest of the main line.
            // This path is taken if the current move has variations AND is not the last move of its sequence.
          } else {
            // If this move (with variations) is the last in its current sequence,
            // the mainLineContinuation up to this point forms a complete variation.
            flatVariations.push({
              moves: mainLineContinuation.map((m) => ({
                ...m,
                rav: undefined,
              })), // Ensure no RAVs in final moves
              tags: pgnData.tags,
              startingFEN: startingFEN,
            });
          }

          // Then process all variations (RAVs) from this move
          move.rav.forEach((variation) => {
            recurse(variation.moves, currentLineContinuation);
          });
        } else if (i === currentMoves.length - 1) {
          // This is the last move in the current sequence, and it has no RAVs.
          // This forms a complete variation line.
          flatVariations.push({
            moves: currentLineContinuation.map((m) => ({
              ...m,
              rav: undefined,
            })), // Ensure no RAVs
            tags: pgnData.tags,
            startingFEN: startingFEN,
          });
        }
      }
    };

    recurse(pgnData.moves, []);
    return flatVariations;
  }

  public getPgnString(): string | null {
    return this.pgnString;
  }

  // Placeholder for more complex PGN parsing and variation extraction
  public getVariations(): Variation[] {
    if (!this.pgnString) {
      return [];
    }
    const mockedPgnParser = new VariationParser();
    const parsedVariations = mockedPgnParser.parse(this.pgnString);
    if (!parsedVariations) {
      return [];
    }

    // Mocked data for demonstration purposes
    // In a real scenario, this would be replaced with actual parsing logic
    return [
      {
        id: 'var1',
        moves: ['e4', 'e5', 'Nf3', 'Nc6'],
        description: 'Main line opening',
      },
    ];
  }
}

export default PgnDataManager;
