export class DrillStateManager {
  private moves: any[];
  private currentMoveIndex: number;

  constructor(moves: any[]) {
    this.moves = moves;
    this.currentMoveIndex = 0;
  }

  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  getExpectedMove(): any {
    return this.moves[this.currentMoveIndex];
  }

  advance(): void {
    this.currentMoveIndex++;
  }

  isComplete(): boolean {
    return this.currentMoveIndex >= this.moves.length;
  }

  reset(): void {
    this.currentMoveIndex = 0;
  }
}
