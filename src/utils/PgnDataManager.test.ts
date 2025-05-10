// src/utils/PgnDataManager.test.ts
import { PgnDataManager } from './PgnDataManager';
import { VariationParser } from './VariationParser';
import {
  ParsedPgn,
  PgnMove,
  PgnRav,
  VariationLine,
  MoveForVariationKey,
} from '@/types/pgnTypes';
import { describe, test, expect, jest, beforeEach, it } from '@jest/globals';

// Mock VariationParser
jest.mock('./VariationParser');

const mockParse = jest.fn<(pgnString: string) => ParsedPgn | null>();

describe('PgnDataManager', () => {
  let pgnDataManager: PgnDataManager;
  let MockVariationParser: jest.MockedClass<typeof VariationParser>;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    // MockVariationParser.mockClear(); // This is for the class
    mockParse.mockClear(); // This is for the instance method
    VariationParser.prototype.parse = mockParse;
    pgnDataManager = new PgnDataManager();
  });

  test('constructor(): should be able to instantiate', () => {
    expect(pgnDataManager).toBeInstanceOf(PgnDataManager);
  });

  describe('loadPgn', () => {
    test('should do nothing if PGN string is empty', () => {
      pgnDataManager.loadPgn('');
      expect(mockParse).not.toHaveBeenCalled();
      expect(pgnDataManager.getParsedPgn()).toBeNull();
    });

    test('should parse a simple PGN string and store parsed data', () => {
      const pgn = '1. e4 e5';
      const parsed: ParsedPgn = { moves: [{ move: 'e4' }, { move: 'e5' }] };
      mockParse.mockReturnValue(parsed);
      pgnDataManager.loadPgn(pgn);
      expect(mockParse).toHaveBeenCalledWith(pgn);
      expect(pgnDataManager.getParsedPgn()).toEqual(parsed);
    });

    test('should parse PGN with comments and NAGs', () => {
      const pgn = '1. e4 {comment} e5 $1';
      const parsed: ParsedPgn = {
        moves: [
          { move: 'e4', comment: 'comment' },
          { move: 'e5', nag: ['$1'] },
        ],
      };
      mockParse.mockReturnValue(parsed);
      pgnDataManager.loadPgn(pgn);
      expect(pgnDataManager.getParsedPgn()).toEqual(parsed);
    });

    test('should parse PGN with nested variations', () => {
      const pgn = '1. e4 (1... d5) e5';
      const parsed: ParsedPgn = {
        moves: [
          { move: 'e4', rav: [{ moves: [{ move: 'd5' }] }] },
          { move: 'e5' },
        ],
      };
      mockParse.mockReturnValue(parsed);
      pgnDataManager.loadPgn(pgn);
      expect(pgnDataManager.getParsedPgn()).toEqual(parsed);
    });
  });

  describe('hasPgnLoaded', () => {
    test('should return false if PGN not loaded', () => {
      expect(pgnDataManager.hasPgnLoaded()).toBe(false);
    });

    test('should return true if PGN is loaded', () => {
      const parsed: ParsedPgn = { moves: [{ move: 'e4' }] };
      mockParse.mockReturnValue(parsed);
      pgnDataManager.loadPgn('1. e4');
      expect(pgnDataManager.hasPgnLoaded()).toBe(true);
    });
  });

  describe('generateVariationKey', () => {
    test('should return empty string for empty moves array', () => {
      expect(pgnDataManager.generateVariationKey([])).toBe('');
    });

    test('should generate a key by joining SAN moves with underscore', () => {
      const moves: MoveForVariationKey[] = [
        { move: 'e4' },
        { move: 'e5' },
        { move: 'Nf3' },
      ];
      expect(pgnDataManager.generateVariationKey(moves)).toBe('e4_e5_Nf3');
    });

    test('should ignore other properties on move objects', () => {
      const moves: MoveForVariationKey[] = [
        { move: 'e4', from: 'e2', to: 'e4' },
        { move: 'e5' },
      ];
      expect(pgnDataManager.generateVariationKey(moves)).toBe('e4_e5');
    });
  });

  describe('flattenVariations', () => {
    test('should return empty array if no PGN data or moves', () => {
      expect(pgnDataManager.flattenVariations(null)).toEqual([]);
      expect(pgnDataManager.flattenVariations({ moves: [] })).toEqual([]);
    });

    test('should flatten a PGN with no variations (main line only)', () => {
      const pgnData: ParsedPgn = {
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
        tags: { White: 'Player1', Black: 'Player2' },
      };
      const expected: VariationLine[] = [
        {
          moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
          tags: { White: 'Player1', Black: 'Player2' },
          startingFEN: undefined,
        },
      ];
      expect(pgnDataManager.flattenVariations(pgnData)).toEqual(expected);
    });

    test('should use startingFEN from PGN tags if available', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const pgnData: ParsedPgn = {
        moves: [{ move: 'e5' }],
        tags: { FEN: fen, White: 'Player1' },
      };
      const expected: VariationLine[] = [
        {
          moves: [{ move: 'e5' }],
          tags: { FEN: fen, White: 'Player1' },
          startingFEN: fen,
        },
      ];
      expect(pgnDataManager.flattenVariations(pgnData)).toEqual(expected);
    });

    test('should use startingFEN from pgnData.startingFEN if tags.FEN is not available', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const pgnData: ParsedPgn = {
        moves: [{ move: 'e5' }],
        startingFEN: fen,
        tags: { White: 'Player1' },
      };
      const expected: VariationLine[] = [
        {
          moves: [{ move: 'e5' }],
          tags: { White: 'Player1' },
          startingFEN: fen,
        },
      ];
      expect(pgnDataManager.flattenVariations(pgnData)).toEqual(expected);
    });

    test('should correctly flatten a PGN with one simple variation (RAV)', () => {
      const pgnData: ParsedPgn = {
        moves: [
          { move: 'e4' }, // Main move 1
          {
            move: 'e5', // Main move 2
            rav: [
              // Variation from e5
              { moves: [{ move: 'c5' }, { move: 'Nf3' }] }, // Variation line: e4, c5, Nf3
            ],
          },
          { move: 'Nf3' }, // Main move 3 (after e5). Forms line: e4, e5, Nf3
        ],
      };
      const result = pgnDataManager.flattenVariations(pgnData);
      expect(result).toHaveLength(2);
      // Expected line 1: e4, e5, Nf3
      expect(result).toContainEqual({
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
        tags: undefined,
        startingFEN: undefined,
      });
      // Expected line 2: e4, c5, Nf3
      expect(result).toContainEqual({
        moves: [{ move: 'e4' }, { move: 'c5' }, { move: 'Nf3' }],
        tags: undefined,
        startingFEN: undefined,
      });
    });

    test('should correctly flatten PGN with nested RAVs', () => {
      const pgnData: ParsedPgn = {
        moves: [
          { move: 'e4' }, // M1
          {
            // M2
            move: 'e5',
            rav: [
              // V2a (from e5)
              {
                moves: [
                  { move: 'c5' }, // V2a.1
                  {
                    // V2a.2
                    move: 'Nf3',
                    rav: [
                      // V2a.2.i (from Nf3 in V2a)
                      { moves: [{ move: 'd6' }, { move: 'd4' }] }, // V2a.2.i.1, V2a.2.i.2 -> e4, c5, Nf3, d6, d4
                    ],
                  },
                  { move: 'Nc6' }, // V2a.3 (after Nf3 in V2a) -> e4, c5, Nf3, Nc6
                ],
              },
            ],
          },
          { move: 'Bc4' }, // M3 (after e5) -> e4, e5, Bc4
        ],
      };
      const result = pgnDataManager.flattenVariations(pgnData);

      // Expect 3 lines:
      // 1. Main: e4, e5, Bc4
      // 2. Variation from e5, then main part of that variation: e4, c5, Nf3, Nc6
      // 3. Variation from e5, then sub-variation from Nf3: e4, c5, Nf3, d6, d4
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Bc4' }],
        tags: undefined,
        startingFEN: undefined,
      });
      expect(result).toContainEqual({
        moves: [
          { move: 'e4' },
          { move: 'c5' },
          { move: 'Nf3' },
          { move: 'Nc6' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
      expect(result).toContainEqual({
        moves: [
          { move: 'e4' },
          { move: 'c5' },
          { move: 'Nf3' },
          { move: 'd6' },
          { move: 'd4' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
    });

    test('should handle multiple RAVs at the same level', () => {
      const pgnData: ParsedPgn = {
        moves: [
          { move: 'e4' },
          {
            move: 'e5',
            rav: [
              { moves: [{ move: 'c5' }] }, // Var 1: e4, c5
              { moves: [{ move: 'c6' }] }, // Var 2: e4, c6
            ],
          },
          // No main line continuation after e5, so e4, e5 is not a line itself
        ],
      };
      const result = pgnDataManager.flattenVariations(pgnData);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        moves: [{ move: 'e4' }, { move: 'c5' }],
        tags: undefined,
        startingFEN: undefined,
      });
      expect(result).toContainEqual({
        moves: [{ move: 'e4' }, { move: 'c6' }],
        tags: undefined,
        startingFEN: undefined,
      });
    });

    test('should include comments and NAGs in flattened moves but not RAVs', () => {
      const pgnData: ParsedPgn = {
        moves: [
          { move: 'e4', comment: 'start' },
          {
            move: 'e5',
            nag: ['$1'],
            rav: [{ moves: [{ move: 'c5', comment: 'Sicilian' }] }],
          },
          { move: 'Nf3' },
        ],
      };
      const result = pgnDataManager.flattenVariations(pgnData);
      expect(result).toHaveLength(2);
      // Main line: e4 (comment), e5 (nag), Nf3
      expect(result).toContainEqual({
        moves: [
          { move: 'e4', comment: 'start' },
          { move: 'e5', nag: ['$1'] },
          { move: 'Nf3' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
      // Variation: e4 (comment), c5 (comment)
      expect(result).toContainEqual({
        moves: [
          { move: 'e4', comment: 'start' },
          { move: 'c5', comment: 'Sicilian' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
      // Check that RAVs are indeed undefined in the output moves
      result.forEach((line) => {
        line.moves.forEach((move) => {
          expect(move.rav).toBeUndefined();
        });
      });
    });

    test('flattenVariations complex case from TrainingOrchestrator.test.ts', () => {
      const complexPgn: ParsedPgn = {
        moves: [
          { move: 'e4' }, // 1. e4
          {
            move: 'e5', // 1...e5 (Main line part 1)
            rav: [
              {
                // Variation A: 1...c5 (Sicilian)
                moves: [
                  { move: 'c5' }, // 1...c5
                  { move: 'Nf3' }, // 2. Nf3 (after 1...c5)
                  {
                    move: 'd6', // 2...d6
                    rav: [
                      {
                        // Variation A1: 2...Nc6 (after 2.Nf3 in Sicilian)
                        moves: [
                          { move: 'Nc6' }, // 2...Nc6
                          { move: 'Bb5' }, // 3. Bb5
                        ],
                      },
                    ],
                  },
                  { move: 'g6' }, // 3. g6 (after 2...d6 in Sicilian)
                ],
              },
            ],
          },
          { move: 'Nf3' }, // 2. Nf3 (Main line part 2, after 1...e5)
          { move: 'Nc6' }, // 2...Nc6 (Main line part 3)
        ],
      };
      const result = pgnDataManager.flattenVariations(complexPgn);
      // Expected lines:
      // 1. Main line: e4, e5, Nf3, Nc6
      // 2. Sicilian variation A, main: e4, c5, Nf3, d6, g6
      // 3. Sicilian variation A1: e4, c5, Nf3, Nc6, Bb5
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        moves: [
          { move: 'e4' },
          { move: 'e5' },
          { move: 'Nf3' },
          { move: 'Nc6' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
      expect(result).toContainEqual({
        moves: [
          { move: 'e4' },
          { move: 'c5' },
          { move: 'Nf3' },
          { move: 'd6' },
          { move: 'g6' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
      expect(result).toContainEqual({
        moves: [
          { move: 'e4' },
          { move: 'c5' },
          { move: 'Nf3' },
          { move: 'Nc6' },
          { move: 'Bb5' },
        ],
        tags: undefined,
        startingFEN: undefined,
      });
    });
  });
});

describe('PgnDataManager', () => {
  it('should load and store a PGN string', () => {
    const pgnString = '[Event "Test Event"]\n1. e4 e5';
    const dataManager = new PgnDataManager();
    dataManager.loadPgn(pgnString);
    expect(dataManager.getPgnString()).toBe(pgnString);
  });

  it('should return null if no PGN is loaded', () => {
    const dataManager = new PgnDataManager();
    expect(dataManager.getPgnString()).toBeNull();
  });

  // Placeholder for future tests on variation parsing
  it('should return empty array for variations if no PGN loaded', () => {
    const dataManager = new PgnDataManager();
    expect(dataManager.getVariations()).toEqual([]);
  });

  it('should return mock variations when PGN is loaded (placeholder)', () => {
    const pgnString = '[Event "Test Event"]\n1. e4 e5';
    const dataManager = new PgnDataManager(pgnString);
    // This will change when actual parsing is implemented
    expect(dataManager.getVariations()).toEqual([
      {
        id: 'var1',
        moves: ['e4', 'e5', 'Nf3', 'Nc6'],
        description: 'Main line opening',
      },
    ]);
  });
});
