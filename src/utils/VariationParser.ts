import pgnParser from 'pgn-parser';

/**
 * VariationParser extracts a full variation tree from PGN.
 */
export class VariationParser {
  /**
   * Parse PGN and return structured JSON, including RAVs.
   * @param {string} pgn
   * @returns {object} Parsed result (tags + moves + ravs).
   */
  parse(pgn: string) {
    const [result] = pgnParser.parse(pgn);
    return result;
  }
}