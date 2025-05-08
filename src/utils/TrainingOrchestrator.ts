import { VariationParser } from './VariationParser';

// Define a basic type for parsed PGN data for now. This can be expanded later.
// We might want to move this to a types file if it becomes complex.
interface ParsedPgn {
  moves: any[]; // Replace 'any' with a more specific type once VariationParser's output is clearer
  tags?: Record<string, string>;
  result?: string;
  // Add other properties that VariationParser might return
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
}
