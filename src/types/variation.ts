import { PgnMove } from "@/types/pgnTypes";
import { Option, Some, None } from "ts-results";

// Structure for flattened variations
export class Variation {
  private moves: PgnMove[];
  private tags?: Record<string, string>;
  private startingFEN?: string;

  constructor(moves: PgnMove[], tags?: Record<string, string>, startingFEN?: string) {
    this.moves = moves;
    this.tags = tags;
    this.startingFEN = startingFEN;
  }

  public getMoves(): PgnMove[] {
    return this.moves;
  }

  public getTags(): Option<Record<string, string>> {
    if (!this.tags) {
      return None;
    }
    return Some(this.tags);
  }

  public getStartingFEN(): string | undefined {
    return this.startingFEN;
  }

  public getVariationKey(): string {
    return this.moves.map(move => move.move).join(" ");
  }
}
