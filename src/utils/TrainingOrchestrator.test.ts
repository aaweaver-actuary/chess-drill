import { TrainingOrchestrator } from '@/utils/TrainingOrchestrator';
import { describe, test, expect, jest, beforeEach } from '@jest/globals'; // Import jest
import { VariationParser } from '@/utils/VariationParser'; // Import VariationParser
import { ChessEngine } from '@/utils/ChessEngine'; // Added import
import { StatsStore } from '@/utils/StatsStore';   // Added import
import type { ParsedPgn, VariationLine, PgnMove } from '@/utils/TrainingOrchestrator'; // Import types

// Mock VariationParser
jest.mock('@/utils/VariationParser');

// Mock ChessEngine
jest.mock('@/utils/ChessEngine');

// Mock StatsStore
jest.mock('@/utils/StatsStore');

const mockParse = jest.fn();
VariationParser.prototype.parse = mockParse;

// Helper type for mock PGN data (can remain as is or be aligned with actual PgnMove/ParsedPgn if preferred)
// For now, keeping MockMove and MockParsedPgnData for existing tests,
// but new tests might directly use ParsedPgn and VariationLine types.
export interface MockMove {
  move: string;
  comment?: string;
  nag?: string[];
  rav?: MockRav[]; // For nested variations
  // Potentially other PGN move properties
}

// Define a type for RAV (Recursive Annotation Variation)
export interface MockRav {
  moves: MockMove[];
  // Potentially other RAV properties
}

// A helper type for the mock PGN data to ensure consistency
export interface MockParsedPgnData {
  moves: MockMove[];
  result?: string;
  tags?: Record<string, any>; // Allow any for tags in mock
  // Potentially other top-level PGN properties
}

interface MockParsedPgnWithComments extends MockParsedPgnData {
  comments: string[];
}
interface MockParsedPgnWithNags extends MockParsedPgnData {
  nags: string[];
}
interface MockParsedPgnWithRav extends MockParsedPgnData {
  rav: { moves: { move: string }[] }[];
}

describe('TrainingOrchestrator', () => {
  let MockChessEngine: jest.MockedClass<typeof ChessEngine>;
  let MockStatsStore: jest.MockedClass<typeof StatsStore>;
  let mockEngineInstance: jest.Mocked<ChessEngine>;
  let mockStatsStoreInstance: jest.Mocked<StatsStore>;

  beforeEach(() => {
    // Clear mock calls before each test
    mockParse.mockClear();
    // Reset mock return value for each test if necessary
    mockParse.mockReturnValue(undefined);

    // Create new mock instances for each test
    MockChessEngine = ChessEngine as jest.MockedClass<typeof ChessEngine>;
    MockStatsStore = StatsStore as jest.MockedClass<typeof StatsStore>;

    // Mocks for ChessEngine instance methods
    mockEngineInstance = {
      reset: jest.fn(),
      load: jest.fn(), // Mock the load method
      loadPgn: jest.fn(),
      makeMove: jest.fn(),
      getHistory: jest.fn().mockReturnValue([]),
      game: {
        fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
        turn: jest.fn().mockReturnValue('w'),
        // Add other chess.js game properties/methods if needed by TrainingOrchestrator
      },
    } as unknown as jest.Mocked<ChessEngine>; // Use unknown for type assertion flexibility

    // Mocks for StatsStore instance methods
    mockStatsStoreInstance = {
      recordResult: jest.fn(),
      getStats: jest.fn().mockReturnValue({ attempts: 0, successes: 0 }),
    } as unknown as jest.Mocked<StatsStore>;

    MockChessEngine.mockImplementation(() => mockEngineInstance);
    MockStatsStore.mockImplementation(() => mockStatsStoreInstance);
  });

  test('constructor(): should be able to instantiate and initialize ChessEngine and StatsStore', () => {
    const orchestrator = new TrainingOrchestrator();
    expect(orchestrator).toBeDefined();
    expect(MockChessEngine).toHaveBeenCalledTimes(1);
    expect(MockStatsStore).toHaveBeenCalledTimes(1);
    expect(orchestrator.statsStore).toBeDefined();
    expect(orchestrator.statsStore).toBeInstanceOf(MockStatsStore);
    // @ts-ignore access private member for test
    expect(orchestrator._engine).toBeInstanceOf(MockChessEngine);
  });

  describe('loadPgn', () => {
    test('should throw an error if the PGN string is empty', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(() => orchestrator.loadPgn('')).toThrow(
        'PGN string cannot be empty.',
      );
    });

    test('should parse and store a simple PGN string', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnString = '1. e4 e5';
      const mockParsedPgn: MockParsedPgnData = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
        result: '*',
        tags: {},
      };
      mockParse.mockReturnValue(mockParsedPgn);

      orchestrator.loadPgn(pgnString);

      expect(mockParse).toHaveBeenCalledWith(pgnString);
      expect(orchestrator.getParsedPgn()).toEqual(mockParsedPgn); // Verify storage
    });

    test('getParsedPgn() should return null if PGN has not been loaded', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(orchestrator.getParsedPgn()).toBeNull();
    });

    test('loadPgn() should store null if VariationParser returns null (e.g. invalid PGN)', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnString = 'invalid pgn';
      mockParse.mockReturnValue(null); // Simulate parser returning null for invalid PGN

      orchestrator.loadPgn(pgnString);

      expect(mockParse).toHaveBeenCalledWith(pgnString);
      expect(orchestrator.getParsedPgn()).toBeNull();
    });
  });

  describe('loadPgn with complex PGNs', () => {
    test('should correctly parse PGN with comments', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnStringWithComment = '1. e4 {This is a comment} e5';
      // Define what the mock parser should return, including comments if your structure supports it
      const mockParsedPgnWithComment: MockParsedPgnData = {
        moves: [
          { move: 'e4', comment: 'This is a comment' }, // Assuming comments are attached to moves
          { move: 'e5' },
        ],
        result: '*',
        tags: {},
      };
      mockParse.mockReturnValue(mockParsedPgnWithComment);
      orchestrator.loadPgn(pgnStringWithComment);
      expect(mockParse).toHaveBeenCalledWith(pgnStringWithComment);
      expect(orchestrator.getParsedPgn()).toEqual(mockParsedPgnWithComment);
    });

    test('should correctly parse PGN with NAGs', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnStringWithNag = '1. e4 $1 e5'; // $1 is a common NAG for good move
      const mockParsedPgnWithNag: MockParsedPgnData = {
        moves: [
          { move: 'e4', nag: ['$1'] }, // Assuming NAGs are in an array
          { move: 'e5' },
        ],
        result: '*',
        tags: {},
      };
      mockParse.mockReturnValue(mockParsedPgnWithNag);
      orchestrator.loadPgn(pgnStringWithNag);
      expect(mockParse).toHaveBeenCalledWith(pgnStringWithNag);
      expect(orchestrator.getParsedPgn()).toEqual(mockParsedPgnWithNag);
    });

    // Test for nested variations will be more complex and might require adjustments
    // to MockParsedPgnData and the mock implementation of VariationParser
    // For now, this is a placeholder structure
    test('should correctly parse PGN with nested variations (RAVs)', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnStringWithRav = '1. e4 (1... d5 2. exd5) e5';
      const mockParsedPgnWithRav = {
        moves: [
          {
            move: 'e4',
            rav: [{ moves: [{ move: 'd5' }, { move: 'exd5' }] }], // Simplified RAV structure
          },
          { move: 'e5' },
        ],
        result: '*',
        tags: {},
      } as any; // Using 'as any' for now due to complex structure
      mockParse.mockReturnValue(mockParsedPgnWithRav);
      orchestrator.loadPgn(pgnStringWithRav);
      expect(mockParse).toHaveBeenCalledWith(pgnStringWithRav);
      expect(orchestrator.getParsedPgn()).toEqual(mockParsedPgnWithRav);
    });
  });

  describe('hasPgnLoaded', () => {
    test('should return false if PGN has not been loaded', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(orchestrator.hasPgnLoaded()).toBe(false);
    });

    test('should return true if PGN has been successfully loaded', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnString = '1. e4 e5';
      const mockParsedPgn: MockParsedPgnData = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
        result: '*',
        tags: {},
      };
      mockParse.mockReturnValue(mockParsedPgn);
      orchestrator.loadPgn(pgnString);
      expect(orchestrator.hasPgnLoaded()).toBe(true);
    });

    test('should return false if PGN loading resulted in null (invalid PGN)', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnString = 'invalid pgn';
      mockParse.mockReturnValue(null);
      orchestrator.loadPgn(pgnString);
      expect(orchestrator.hasPgnLoaded()).toBe(false);
    });
  });

  describe('generateVariationKey', () => {
    test('should generate a consistent key for a sequence of moves', () => {
      const orchestrator = new TrainingOrchestrator();
      // Use the MockMove type for the moves array
      const moves: MockMove[] = [
        { move: 'e4' },
        { move: 'e5' },
        { move: 'Nf3' },
      ];
      const key1 = orchestrator.generateVariationKey(moves);
      const key2 = orchestrator.generateVariationKey(moves);
      expect(key1).toBe(key2);
      expect(key1).toBe('e4_e5_Nf3');
    });

    test('should generate different keys for different move sequences', () => {
      const orchestrator = new TrainingOrchestrator();
      const moves1: MockMove[] = [{ move: 'e4' }, { move: 'e5' }];
      const moves2: MockMove[] = [{ move: 'd4' }, { move: 'd5' }];
      const key1 = orchestrator.generateVariationKey(moves1);
      const key2 = orchestrator.generateVariationKey(moves2);
      expect(key1).not.toBe(key2);
    });

    test('should handle empty move sequence', () => {
      const orchestrator = new TrainingOrchestrator();
      const moves: MockMove[] = [];
      const key = orchestrator.generateVariationKey(moves);
      expect(key).toBe('');
    });

    test("should generate a key based only on the 'move' property", () => {
      const orchestrator = new TrainingOrchestrator();
      const moves1: MockMove[] = [
        { move: 'e4', comment: 'A comment' },
        { move: 'e5' },
      ];
      const moves2: MockMove[] = [{ move: 'e4' }, { move: 'e5' }];
      const key1 = orchestrator.generateVariationKey(moves1);
      const key2 = orchestrator.generateVariationKey(moves2);
      expect(key1).toBe(key2);
      expect(key1).toBe('e4_e5');
    });
  });

  // New describe block for flattenVariations
  describe('flattenVariations', () => {
    let orchestrator: TrainingOrchestrator;

    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      // We don't need to mock VariationParser.parse here as flattenVariations
      // will take the parsed PGN as an argument.
    });

    test('should return an empty array if parsedPgn is null', () => {
      expect(orchestrator.flattenVariations(null)).toEqual([]);
    });

    test('should return an empty array if parsedPgn has no moves', () => {
      const parsedPgn: ParsedPgn = { moves: [] };
      expect(orchestrator.flattenVariations(parsedPgn)).toEqual([]);
    });

    test('should return a single variation for a PGN with no RAVs', () => {
      const parsedPgn: ParsedPgn = {
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
        tags: { White: 'User' }, // Example tag
      };
      const expectedFlatVariations: VariationLine[] = [
        {
          moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
          tags: { White: 'User' },
          startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
      ];
      expect(orchestrator.flattenVariations(parsedPgn)).toEqual(
        expectedFlatVariations,
      );
    });

    test('should use FEN from tags if provided', () => {
      const customFEN = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
      const parsedPgn: ParsedPgn = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
        tags: { FEN: customFEN, White: 'User' },
      };
      const expectedFlatVariations: VariationLine[] = [
        {
          moves: [{ move: 'e4' }, { move: 'e5' }],
          tags: { FEN: customFEN, White: 'User' },
          startingFEN: customFEN,
        },
      ];
      const result = orchestrator.flattenVariations(parsedPgn);
      expect(result).toEqual(expectedFlatVariations);
      expect(result[0].startingFEN).toBe(customFEN);
    });

    test('should flatten a PGN with a simple RAV at the first move', () => {
      const parsedPgn: ParsedPgn = {
        moves: [
          { move: 'e4', rav: [{ moves: [{ move: 'd5' }, { move: 'exd5' }] }] },
          { move: 'e5' },
        ],
        tags: { Event: 'Test Game' },
      };
      const expectedFlatVariations: VariationLine[] = [
        {
          moves: [{ move: 'e4' }, { move: 'e5' }],
          tags: { Event: 'Test Game' },
          startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
        {
          moves: [{ move: 'd5' }, { move: 'exd5' }], // This line starts from the FEN *before* 'e4'
          tags: { Event: 'Test Game' },
          startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
      ];
      const result = orchestrator
        .flattenVariations(parsedPgn)
        .sort((a, b) => a.moves[0].move.localeCompare(b.moves[0].move));
      
      // Sort expected as well for consistent comparison
      const expectedSorted = expectedFlatVariations.sort((a,b) => a.moves[0].move.localeCompare(b.moves[0].move));
      expect(result).toEqual(expectedSorted);
    });

    test('should flatten a PGN with a RAV deeper in the main line', () => {
      const parsedPgn: ParsedPgn = {
        moves: [
          { move: 'e4' },
          { move: 'e5' },
          { move: 'Nf3', rav: [{ moves: [{ move: 'Nc6' }, { move: 'Bb5' }] }] },
          { move: 'Bc4' },
        ],
        tags: { Game: 'Deep RAV' }
      };
      const expectedFlatVariations: VariationLine[] = [
        {
          moves: [
            { move: 'e4' },
            { move: 'e5' },
            { move: 'Nf3' },
            { move: 'Bc4' },
          ],
          tags: { Game: 'Deep RAV' },
          startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
        {
          moves: [
            { move: 'e4' },
            { move: 'e5' },
            { move: 'Nc6' },
            { move: 'Bb5' },
          ],
          tags: { Game: 'Deep RAV' },
          startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
      ];
      const result = orchestrator
        .flattenVariations(parsedPgn)
        .sort((a, b) => a.moves[2].move.localeCompare(b.moves[2].move));
      const expectedSorted = expectedFlatVariations.sort((a,b) => a.moves[2].move.localeCompare(b.moves[2].move));
      expect(result).toEqual(expectedSorted);
    });

    test('should handle multiple RAVs at the same level', () => {
    test('should include comments and NAGs in flattened variations if they exist on moves', () => {
      const parsedPgn: MockParsedPgnData = {
        moves: [
          { move: 'e4', comment: 'Good move' },
          {
            move: 'e5',
            nag: ['$1'],
            rav: [{ moves: [{ move: 'd5', comment: 'Alternative' }] }],
          },
        ],
      };
      const expectedFlatVariations = [
        {
          moves: [
            { move: 'e4', comment: 'Good move' },
            { move: 'e5', nag: ['$1'] },
          ],
          tags: undefined,
        },
        {
          moves: [
            { move: 'e4', comment: 'Good move' },
            { move: 'd5', comment: 'Alternative' },
          ],
          tags: undefined,
        },
      ];
      const result = orchestrator
        .flattenVariations(parsedPgn)
        .sort((a, b) => a.moves[1].move.localeCompare(b.moves[1].move));
      expect(result).toEqual(
        expectedFlatVariations.sort((a, b) =>
          a.moves[1].move.localeCompare(b.moves[1].move),
        ),
      );
    });
  });

  describe('selectRandomVariation', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return undefined if the input array is empty', () => {
      const result = orchestrator.selectRandomVariation([]);
      expect(result).toBeUndefined();
    });

    test('should return the only variation if array has one element', () => {
      const variation = { moves: [{ move: 'e4' }], tags: { White: 'User' } };
      const result = orchestrator.selectRandomVariation([variation]);
      expect(result).toBe(variation);
    });

    test('should return a variation from the array (randomly)', () => {
      const variations = [
        { moves: [{ move: 'e4' }], tags: { White: 'User' } },
        { moves: [{ move: 'd4' }], tags: { White: 'User' } },
        { moves: [{ move: 'c4' }], tags: { White: 'User' } },
      ];
      // Mock Math.random to always return 0.5 (middle element)
      const originalRandom = Math.random;
      Math.random = () => 0.5;
      const result = orchestrator.selectRandomVariation(variations);
      expect(variations).toContain(result);
      Math.random = originalRandom;
    });
  });

  describe('selectRandomVariation edge cases', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return undefined if PGN is not loaded and flattenVariations is called with null', () => {
      // Simulate not loaded PGN
      const result = orchestrator.selectRandomVariation(
        orchestrator.flattenVariations(null),
      );
      expect(result).toBeUndefined();
    });

    test('should return undefined if flattenVariations returns an empty array', () => {
      // Simulate loaded PGN but no moves
      const result = orchestrator.selectRandomVariation([]);
      expect(result).toBeUndefined();
    });
  });

  describe('getCurrentVariation', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return undefined if no variation has been selected', () => {
      expect(orchestrator.getCurrentVariation()).toBeUndefined();
    });

    test('should return the currently selected variation after selection', () => {
      const variations = [
        { moves: [{ move: 'e4' }], tags: { White: 'User' } },
        { moves: [{ move: 'd4' }], tags: { White: 'User' } },
      ];
      // Simulate selection
      // @ts-ignore (simulate private property for test)
      orchestrator._currentVariation = variations[1];
      expect(orchestrator.getCurrentVariation()).toBe(variations[1]);
    });
  });

  describe('getCurrentVariationKey', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return an empty string if no variation is selected', () => {
      expect(orchestrator.getCurrentVariationKey()).toBe('');
    });

    test('should return the correct key for the current variation', () => {
      const variation = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
        tags: { White: 'User' },
      };
      // @ts-ignore (simulate private property for test)
      orchestrator._currentVariation = variation;
      expect(orchestrator.getCurrentVariationKey()).toBe('e4_e5');
    });
  });

  describe('determineUserColor', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return "w" if the first move is a White move (e.g., e4)', () => {
      const variation = { moves: [{ move: 'e4' }, { move: 'e5' }] };
      expect(orchestrator.determineUserColor(variation)).toBe('w');
    });

    test('should return "b" if the first move is a Black move (e.g., ...e5)', () => {
      const variation = { moves: [{ move: '...e5' }, { move: 'Nf3' }] };
      expect(orchestrator.determineUserColor(variation)).toBe('b');
    });

    test('should return undefined if moves array is empty', () => {
      const variation = { moves: [] };
      expect(orchestrator.determineUserColor(variation)).toBeUndefined();
    });
  });

  describe('startTrainingSession', () => {
    test('should throw an error if PGN is not loaded', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(() => orchestrator.startTrainingSession()).toThrow(
        'PGN not loaded. Cannot start training session.', // Corrected message
      );
    });
  });

  describe('startTrainingSession (core logic)', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should select a random variation, determine user color, and initialize ChessEngine', () => {
      // Mock parsed PGN and flattenVariations
      const mockParsedPgn = { moves: [{ move: 'e4' }, { move: 'e5' }] };
      // @ts-ignore
      orchestrator.parsedPgn = mockParsedPgn;
      const variations = [
        { moves: [{ move: 'e4' }, { move: 'e5' }], tags: { White: 'User' } },
        { moves: [{ move: 'd4' }, { move: 'd5' }], tags: { White: 'User' } },
      ];
      jest.spyOn(orchestrator, 'flattenVariations').mockReturnValue(variations);
      jest
        .spyOn(orchestrator, 'selectRandomVariation')
        .mockReturnValue(variations[1]);
      jest.spyOn(orchestrator, 'determineUserColor').mockReturnValue('w');

      orchestrator.startTrainingSession();

      // @ts-ignore
      expect(orchestrator._currentVariation).toBe(variations[1]);
      // @ts-ignore
      expect(orchestrator._userColor).toBe('w');
      // @ts-ignore
      expect(orchestrator._engine).toBeDefined();
    });
  });

  describe('startTrainingSession (auto-advance to user turn)', () => {
    let orchestrator: TrainingOrchestrator;
    let ChessEngineMock: any;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      // Mock ChessEngine
      ChessEngineMock = jest.fn().mockImplementation(() => {
        return {
          reset: jest.fn(),
          makeMove: jest.fn(),
          game: {
            turn: jest.fn(),
            fen: jest.fn().mockReturnValue('mocked-fen'),
          },
        };
      });
      jest.resetModules();
      jest.doMock('./ChessEngine', () => ({ ChessEngine: ChessEngineMock }));
    });

    afterEach(() => {
      jest.dontMock('./ChessEngine');
    });

    test("should auto-play opponent moves until it is the user's turn", () => {
      // User is Black, variation starts with White's move
      const mockParsedPgn = {
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
      };
      // @ts-ignore
      orchestrator.parsedPgn = mockParsedPgn;
      const variation = {
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
      };
      jest
        .spyOn(orchestrator, 'flattenVariations')
        .mockReturnValue([variation]);
      jest
        .spyOn(orchestrator, 'selectRandomVariation')
        .mockReturnValue(variation);
      jest.spyOn(orchestrator, 'determineUserColor').mockReturnValue('b');

      orchestrator.startTrainingSession();

      // @ts-ignore
      const engine = orchestrator._engine;
      // Should have called makeMove for e4 (White's move), then stopped for Black's turn
      expect(engine.makeMove).toHaveBeenCalledWith('e4');
      // Should not have called makeMove for e5 (Black's move)
      expect(engine.makeMove).not.toHaveBeenCalledWith('e5');
    });
  });

  describe('getCurrentFen', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return undefined if engine is not initialized', () => {
      expect(orchestrator.getCurrentFen()).toBeUndefined();
    });

    test('should return the FEN from the ChessEngine if initialized', () => {
      // @ts-ignore
      orchestrator._engine = { game: { fen: () => 'mocked-fen' } };
      expect(orchestrator.getCurrentFen()).toBe('mocked-fen');
    });
  });

  describe('getExpectedMoveForCurrentUser', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return undefined if no variation is selected', () => {
      expect(orchestrator.getExpectedMoveForCurrentUser()).toBeUndefined();
    });

    test('should return the next move object for the current user', () => {
      // User is White, first move
      // @ts-ignore
      orchestrator._currentVariation = {
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
      };
      // @ts-ignore
      orchestrator._userColor = 'w';
      // @ts-ignore
      orchestrator._engine = { getHistory: () => [] };
      const move = orchestrator.getExpectedMoveForCurrentUser();
      expect(move).toEqual({ move: 'e4' });
    });

    test('should return the next move object for the current user after some moves', () => {
      // User is Black, after one move played
      // @ts-ignore
      orchestrator._currentVariation = {
        moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
      };
      // @ts-ignore
      orchestrator._userColor = 'b';
      // @ts-ignore
      orchestrator._engine = { getHistory: () => [{ san: 'e4' }] };
      const move = orchestrator.getExpectedMoveForCurrentUser();
      expect(move).toEqual({ move: 'e5' });
    });

    test('should return undefined if all moves are played', () => {
      // @ts-ignore
      orchestrator._currentVariation = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
      };
      // @ts-ignore
      orchestrator._userColor = 'w';
      // @ts-ignore
      orchestrator._engine = {
        getHistory: () => [{ san: 'e4' }, { san: 'e5' }],
      };
      expect(orchestrator.getExpectedMoveForCurrentUser()).toBeUndefined();
    });
  });

  describe('isUserTurn', () => {
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should return false if no variation or engine is set', () => {
      expect(orchestrator.isUserTurn()).toBe(false);
    });

    test('should return true if the next move is for the user', () => {
      // User is White, first move
      // @ts-ignore
      orchestrator._currentVariation = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
      };
      // @ts-ignore
      orchestrator._userColor = 'w';
      // @ts-ignore
      orchestrator._engine = { getHistory: () => [] };
      expect(orchestrator.isUserTurn()).toBe(true);
    });

    test('should return false if the next move is for the opponent', () => {
      // User is Black, after one move played
      // @ts-ignore
      orchestrator._currentVariation = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
      };
      // @ts-ignore
      orchestrator._userColor = 'b';
      // @ts-ignore
      orchestrator._engine = { getHistory: () => [] };
      expect(orchestrator.isUserTurn()).toBe(false);
    });
  });

  describe('handleUserMove', () => {
    let orchestrator: any;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should throw if no training session is active', () => {
      expect(() =>
        orchestrator.handleUserMove({ from: 'e2', to: 'e4' }),
      ).toThrow('No active training session.');
    });

    test("should throw if it is not the user's turn", () => {
      // @ts-ignore
      orchestrator._currentVariation = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
      };
      // @ts-ignore
      orchestrator._userColor = 'w';
      // @ts-ignore
      orchestrator._engine = { getHistory: () => [{ san: 'e4' }] }; // Black's turn
      jest.spyOn(orchestrator, 'isUserTurn').mockReturnValue(false);
      expect(() =>
        orchestrator.handleUserMove({ from: 'e2', to: 'e4' }),
      ).toThrow("It is not the user's turn.");
    });
  });

  describe('handleUserMove (correct move)', () => {
    let orchestrator: any;
    let StatsStoreMock: any;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      // Mock stats store
      StatsStoreMock = { recordResult: jest.fn() };
      orchestrator.statsStore = StatsStoreMock;
      // Set up a simple variation and engine
      orchestrator._currentVariation = {
        moves: [
          { move: 'e4' },
          { move: 'e5' },
          { move: 'Nf3' },
          { move: 'Nc6' },
        ],
      };
      orchestrator._userColor = 'w';
      orchestrator._engine = {
        getHistory: () => [],
        makeMove: jest
          .fn()
          .mockReturnValue({ from: 'e2', to: 'e4', san: 'e4' }),
        game: { fen: () => 'fen-after-e4' },
      };
      jest
        .spyOn(orchestrator, 'getExpectedMoveForCurrentUser')
        .mockReturnValue({ from: 'e2', to: 'e4' });
      jest.spyOn(orchestrator, 'isUserTurn').mockReturnValue(true);
    });

    test('should record stats, advance game, and return correct result for correct move', () => {
      const result = orchestrator.handleUserMove({ from: 'e2', to: 'e4' });
      expect(StatsStoreMock.recordResult).toHaveBeenCalled();
      expect(orchestrator._engine.makeMove).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
      });
      expect(result.isValid).toBe(true);
      expect(result.isVariationComplete).toBe(false);
      expect(result.nextFen).toBe('fen-after-e4');
    });
  });

  describe('handleUserMove (incorrect move)', () => {
    let orchestrator: any;
    let StatsStoreMock: any;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      // Mock stats store
      StatsStoreMock = { recordResult: jest.fn() };
      orchestrator.statsStore = StatsStoreMock;
      // Set up a simple variation and engine
      orchestrator._currentVariation = {
        moves: [
          { move: 'e4' },
          { move: 'e5' },
          { move: 'Nf3' },
          { move: 'Nc6' },
        ],
      };
      orchestrator._userColor = 'w';
      orchestrator._engine = {
        getHistory: () => [],
        makeMove: jest
          .fn()
          .mockReturnValue({ from: 'e2', to: 'e4', san: 'e4' }),
        game: { fen: () => 'fen-after-e4' },
      };
      jest
        .spyOn(orchestrator, 'getExpectedMoveForCurrentUser')
        .mockReturnValue({ move: 'e4' });
      jest.spyOn(orchestrator, 'isUserTurn').mockReturnValue(true);
    });

    test('should record stats, not advance game, and return correct result for incorrect move', () => {
      const result = orchestrator.handleUserMove({ from: 'e2', to: 'e3' });
      expect(StatsStoreMock.recordResult).toHaveBeenCalled();
      expect(orchestrator._engine.makeMove).not.toHaveBeenCalled();
      expect(result.isValid).toBe(false);
      expect(result.expectedMove).toEqual({ move: 'e4' });
    });
  });

  describe('handleUserMove (variation complete)', () => {
    let orchestrator: any;
    let StatsStoreMock: any;
    let mockHistory: any[];

    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      StatsStoreMock = { recordResult: jest.fn() };
      orchestrator.statsStore = StatsStoreMock;
      orchestrator._currentVariation = {
        moves: [
          { from: 'e2', to: 'e4' }, // Move 1
          { from: 'e7', to: 'e5' }, // Move 2 (last move for this variation)
        ],
      };
      orchestrator._userColor = 'w';

      // Initial history before the user makes the last move
      mockHistory = [{ from: 'e2', to: 'e4', san: 'e4' }];

      orchestrator._engine = {
        getHistory: jest.fn(() => mockHistory),
        makeMove: jest.fn((moveMade) => {
          // Simulate adding the move to history
          // In a real engine, makeMove would update its internal history
          mockHistory.push({ ...moveMade, san: moveMade.san || moveMade.to });
          return { ...moveMade, san: moveMade.san || moveMade.to };
        }),
        game: { fen: () => 'final-fen' },
      };

      // Mock getExpectedMoveForCurrentUser to return the move the user is about to make
      jest
        .spyOn(orchestrator, 'getExpectedMoveForCurrentUser')
        .mockReturnValue({ from: 'e7', to: 'e5' });
      jest.spyOn(orchestrator, 'isUserTurn').mockReturnValue(true);
    });

    test('should return isVariationComplete true when last move is played', () => {
      const result = orchestrator.handleUserMove({ from: 'e7', to: 'e5' });
      expect(result.isValid).toBe(true);
      expect(orchestrator._engine.makeMove).toHaveBeenCalledWith({
        from: 'e7',
        to: 'e5',
      });
      // After the move, history should have 2 items
      expect(mockHistory.length).toBe(2);
      expect(result.isVariationComplete).toBe(true);
      expect(result.nextFen).toBe('final-fen');
    });
  });

  describe('handleUserMove (correct move with opponent auto-reply)', () => {
    let orchestrator: any;
    let StatsStoreMock: any;
    let ChessEngineMockInstance: any;

    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      StatsStoreMock = { recordResult: jest.fn() };
      orchestrator.statsStore = StatsStoreMock;

      // Mock ChessEngine instance and its methods
      ChessEngineMockInstance = {
        getHistory: jest.fn(),
        makeMove: jest.fn(),
        game: { fen: jest.fn() },
      };
      // @ts-ignore
      orchestrator._engine = ChessEngineMockInstance; // Inject mock instance

      orchestrator._currentVariation = {
        moves: [
          { move: 'e4', from: 'e2', to: 'e4' }, // User's move
          { move: 'e5', from: 'e7', to: 'e5' }, // Opponent's reply
          { move: 'Nf3', from: 'g1', to: 'f3' }, // User's next move
        ],
      };
      orchestrator._userColor = 'w';

      // User is about to play e4
      jest.spyOn(orchestrator, 'isUserTurn').mockReturnValue(true);
      jest
        .spyOn(orchestrator, 'getExpectedMoveForCurrentUser')
        .mockReturnValue({ move: 'e4', from: 'e2', to: 'e4' });

      // Simulate history before user's move (empty)
      ChessEngineMockInstance.getHistory.mockReturnValue([]);
      // Simulate engine responses
      ChessEngineMockInstance.makeMove.mockImplementation((move: any) => {
        // For user's move e4
        if (move.from === 'e2' && move.to === 'e4') {
          // Update history to include user's move for subsequent calls
          ChessEngineMockInstance.getHistory.mockReturnValueOnce([
            { from: 'e2', to: 'e4', san: 'e4' },
          ]);
          ChessEngineMockInstance.game.fen.mockReturnValueOnce('fen-after-e4');
          return { from: 'e2', to: 'e4', san: 'e4' };
        }
        // For opponent's move e5
        if (move.from === 'e7' && move.to === 'e5') {
          // Update history to include opponent's move
          ChessEngineMockInstance.getHistory.mockReturnValueOnce([
            { from: 'e2', to: 'e4', san: 'e4' },
            { from: 'e7', to: 'e5', san: 'e5' },
          ]);
          ChessEngineMockInstance.game.fen.mockReturnValueOnce(
            'fen-after-e4-e5',
          );
          return { from: 'e7', to: 'e5', san: 'e5' };
        }
        return null; // Should not happen in this test
      });
    });

    test('should make user move, then auto-reply with opponent move, and return correct details', () => {
      const userMove = { from: 'e2', to: 'e4' };
      const result = orchestrator.handleUserMove(userMove);

      expect(result.isValid).toBe(true);
      expect(result.isVariationComplete).toBe(false);
      expect(result.nextFen).toBe('fen-after-e4-e5'); // FEN after opponent's move
      expect(result.opponentMove).toEqual({ move: 'e5', from: 'e7', to: 'e5' }); // Opponent's move details

      // Verify user's move was made
      expect(ChessEngineMockInstance.makeMove).toHaveBeenCalledWith(userMove);
      // Verify opponent's move was made
      expect(ChessEngineMockInstance.makeMove).toHaveBeenCalledWith({
        from: 'e7',
        to: 'e5',
      }); // or just 'e5' if your engine takes SAN

      expect(StatsStoreMock.recordResult).toHaveBeenCalledWith(
        orchestrator.getCurrentVariationKey(),
        true,
      );
    });
  });

  describe('getVariationPlayCount', () => {
    let orchestrator: any;
    let StatsStoreMock: any;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      StatsStoreMock = {
        getStats: jest.fn().mockReturnValue({ attempts: 3, successes: 2 }),
      };
      orchestrator.statsStore = StatsStoreMock;
    });

    test('should return the play count (attempts) for a given variation key', () => {
      const key = 'e4_e5_Nf3';
      const count = orchestrator.getVariationPlayCount(key);
      expect(StatsStoreMock.getStats).toHaveBeenCalledWith(key);
      expect(count).toBe(3);
    });

    test('should return 0 if the variation key is not found in stats', () => {
      StatsStoreMock.getStats.mockReturnValue({ attempts: 0, successes: 0 });
      const key = 'd4_d5_c4';
      const count = orchestrator.getVariationPlayCount(key);
      expect(StatsStoreMock.getStats).toHaveBeenCalledWith(key);
      expect(count).toBe(0);
    });
  });

  describe('getVariationSuccessRate', () => {
    let orchestrator: any;
    let StatsStoreMock: any;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      StatsStoreMock = { getStats: jest.fn() };
      orchestrator.statsStore = StatsStoreMock;
    });

    test('should return the success rate for a given variation key', () => {
      StatsStoreMock.getStats.mockReturnValue({ attempts: 10, successes: 7 });
      const key = 'e4_e5_Nf3_Nc6';
      const rate = orchestrator.getVariationSuccessRate(key);
      expect(StatsStoreMock.getStats).toHaveBeenCalledWith(key);
      expect(rate).toBe(0.7);
    });

    test('should return 0 if attempts are 0 to avoid division by zero', () => {
      StatsStoreMock.getStats.mockReturnValue({ attempts: 0, successes: 0 });
      const key = 'd4_d5_c4_e6';
      const rate = orchestrator.getVariationSuccessRate(key);
      expect(StatsStoreMock.getStats).toHaveBeenCalledWith(key);
      expect(rate).toBe(0);
    });

    test('should return 0 if the variation key is not found in stats', () => {
      StatsStoreMock.getStats.mockReturnValue({ attempts: 0, successes: 0 }); // Or mock it to return undefined/null if that's the behavior
      const key = 'non_existent_key';
      const rate = orchestrator.getVariationSuccessRate(key);
      expect(StatsStoreMock.getStats).toHaveBeenCalledWith(key);
      expect(rate).toBe(0);
    });
  });
});
