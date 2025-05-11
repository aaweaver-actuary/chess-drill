// src/utils/PgnDataManager.ts
import { VariationParser } from './VariationParser';
import { ParsedPgn, PgnMove, MoveForVariationKey } from '@/types/pgnTypes';
import { Variation } from '@/types/variation';
import { Option, Some, None } from 'ts-results';

export class PgnDataManager {
  static generateVariationKey(arg0: never[]): any {
    throw new Error('Method not implemented.');
  }
  private variationParser: VariationParser;
  private parsedPgn: ParsedPgn | null = null;
  private pgnString: string | null = null;

  constructor(pgnString?: string) {
    this.variationParser = new VariationParser();
    if (pgnString) {
      this.loadPgn(pgnString);
    }
  }

  private parsePgn(pgnString: string): Option<ParsedPgn> {
    const variationParser = this.variationParser;
    const parsedPgn = variationParser.parse(pgnString);
    if (parsedPgn) {
      return Some(parsedPgn);
    }
    return None;
  }

  /**
   * Loads a PGN string, parses it, and stores the parsed data.
   *
   * @param pgnString The PGN string to load. If the string is empty, the parsed PGN and PGN string are set to null.
   *
   * @remarks
   * If parsing fails, the error is caught and logged.
   */
  public loadPgn(pgnString: string): void {
    if (!pgnString) {
      this.parsedPgn = null;
      this.pgnString = null;
      return;
    }
    // TODO: Add try-catch for parsing errors
    this.parsedPgn = this.parsePgn(pgnString).unwrap();
    this.pgnString = pgnString;
    console.log('PGN Data Loaded:', this.pgnString);
  }

  public getParsedPgn(): Option<ParsedPgn> {
    if (!this.parsedPgn) {
      return None;
    }
    return Some(this.parsedPgn);
  }

  public hasPgnLoaded(): boolean {
    return this.isPgnDataEmpty(this.parsedPgn);
  }

  public generateVariationKey(variationMoves: MoveForVariationKey[]): string {
    if (!variationMoves || variationMoves.length === 0) {
      return '';
    }
    return variationMoves.map((m) => m.move).join('_');
  }

  public flattenVariations(pgnData: ParsedPgn | null): Variation[] {
    if (this.isPgnDataEmpty(pgnData)) {
      return [];
    }

    const flatVariations: Variation[] = [];
    const startingFEN = pgnData.tags?.FEN || pgnData.startingFEN;

    const recurse = (currentMoves: PgnMove[], accumulatedLine: PgnMove[]) => {
      for (let i = 0; i < currentMoves.length; i++) {
        const move = { ...currentMoves[i] };
        const currentLineContinuation = [...accumulatedLine, move];

        delete move.rav;

        const ravArray: PgnMove[] = move.rav || [];
        let variation;

        if (ravArray.length > 0) {
          // Process main line first
          const mainLineContinuation = [...currentLineContinuation];
          if (i + 1 < currentMoves.length) {
            // If there are more moves after the current one in the main sequence,
            // continue recursion for the rest of the main line.
            // This path is taken if the current move has variations AND is not the last move of its sequence.
          } else {
            variation = this.getMiddleVariation(
              mainLineContinuation,
              pgnData,
              startingFEN,
            );
          }

          // Then process all variations (RAVs) from this move
          this.processAllVariations(ravArray, recurse, currentLineContinuation);
        } else if (i === currentMoves.length - 1) {
          // This is the last move in the current sequence, and it has no RAVs.
          // This forms a complete variation line.
          (variation = this.getLastVariation(
            currentLineContinuation,
            pgnData,
            startingFEN,
          )),
            flatVariations.push(variation);
        }
      }
    };

    recurse(pgnData.moves, []);
    return flatVariations;
  }

  private getMiddleVariation(
    mainLineContinuation: PgnMove[],
    pgnData: ParsedPgn | null,
    startingFEN: string | undefined,
  ): Variation {
    return {
      moves: mainLineContinuation.map((m) => ({
        ...m,
        rav: undefined,
      })),
      tags: pgnData.tags,
      startingFEN: startingFEN,
    };
  }

  private isPgnDataEmpty(pgnData: ParsedPgn | null) {
    return !pgnData || !pgnData.moves;
  }

  private getLastVariation(
    currentLineContinuation: PgnMove[],
    pgnData: ParsedPgn,
    startingFEN: string | undefined,
  ): Variation {
    return {
      moves: currentLineContinuation.map((m) => ({
        ...m,
        rav: undefined,
      })), // Ensure no RAVs
      tags: pgnData.tags,
      startingFEN: startingFEN,
    };
  }

  private processAllVariations(
    ravArray: PgnMove[],
    recurse: (currentMoves: PgnMove[], accumulatedLine: PgnMove[]) => void,
    currentLineContinuation: PgnMove[],
  ) {
    ravArray.forEach((variation) => {
      recurse(variation.moves, currentLineContinuation);
    });
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
        moves: [
          { move: 'e4' },
          { move: 'e5' },
          { move: 'Nf3' },
          { move: 'Nc6' },
        ],
        description: 'Main line opening',
      },
    ];
  }
}

export default PgnDataManager;
