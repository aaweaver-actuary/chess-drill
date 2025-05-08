import { VariationParser } from './VariationParser';

// Define a basic type for parsed PGN data for now. This can be expanded later.
// We might want to move this to a types file if it becomes complex.
interface ParsedPgn {
  moves: any[]; // Replace 'any' with a more specific type once VariationParser's output is clearer
  tags?: Record<string, string>;
  result?: string;
  // Add other properties that VariationParser might return
}

// Interface for the objects expected in the array passed to generateVariationKey
// Ensures that only the 'move' property is used for generating the key.
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

  // Getter to be used by the next test
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
    // Create the key by joining only the 'move' property of each object.
    return variationMoves.map(m => m.move).join('_');
  }
}
