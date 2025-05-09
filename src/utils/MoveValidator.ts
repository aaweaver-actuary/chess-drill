export class MoveValidator {
  static isMatch(expected: any, user: any): boolean {
    // Match by from/to/promotion if present
    if (expected.from && expected.to) {
      if (expected.from !== user.from || expected.to !== user.to) return false;
      if (expected.promotion || user.promotion) {
        return expected.promotion === user.promotion;
      }
      return true;
    }
    // Fallback: match by SAN
    if (expected.move && user.move) {
      return expected.move === user.move;
    }
    return false;
  }
}
