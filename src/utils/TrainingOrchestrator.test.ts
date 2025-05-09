import {
  TrainingOrchestrator,
  // ParsedPgn, PgnMove, PgnRav, VariationLine, // These types are now imported from @/types/pgnTypes
} from '@/utils/TrainingOrchestrator';
import {
  ParsedPgn,
  PgnMove,
  PgnRav,
  VariationLine,
  MoveForVariationKey,
} from '@/types/pgnTypes'; // Added import
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
// import { VariationParser } from '@/utils/VariationParser'; // No longer directly used by TrainingOrchestrator
import { PgnDataManager } from '@/utils/PgnDataManager'; // Import PgnDataManager
import { ChessEngine } from '@/utils/ChessEngine';
import { StatsStore } from '@/utils/StatsStore';
import { DrillSession } from '@/utils/DrillSession'; // Import DrillSession

// Mock PgnDataManager
jest.mock('@/utils/PgnDataManager');

// Mock ChessEngine
jest.mock('@/utils/ChessEngine');

// Mock StatsStore
jest.mock('@/utils/StatsStore');

// Mock DrillSession
jest.mock('@/utils/DrillSession');

// Helper function to create a mock PgnDataManager instance
const createMockPgnDataManager = () => ({
  loadPgn: jest.fn(),
  getParsedPgn: jest.fn().mockReturnValue(null),
  hasPgnLoaded: jest.fn().mockReturnValue(false),
  generateVariationKey: jest
    .fn()
    .mockImplementation((moves: MoveForVariationKey[]) =>
      moves.map((m) => m.move).join('_'),
    ),
  flattenVariations: jest.fn().mockReturnValue([]),
});

// Helper function to create a mock DrillSession instance
const createMockDrillSessionInstance = () => ({
  getCurrentFen: jest
    .fn()
    .mockReturnValue(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    ),
  getExpectedMove: jest.fn().mockReturnValue(null),
  isUserTurn: jest.fn().mockReturnValue(false),
  handleUserMove: jest.fn().mockReturnValue({
    success: false,
    isCorrectMove: false,
    newFen: '',
    isComplete: false,
  }),
  isDrillComplete: jest.fn().mockReturnValue(false),
  getVariation: jest.fn().mockReturnValue(undefined),
  getUserColor: jest.fn().mockReturnValue('w'),
});

describe('TrainingOrchestrator', () => {
  let MockPgnDataManager: jest.MockedClass<typeof PgnDataManager>; // For the class mock
  let mockPgnDataManagerInstance: jest.Mocked<PgnDataManager>; // For the instance mock
  let MockChessEngine: jest.MockedClass<typeof ChessEngine>;
  let MockStatsStore: jest.MockedClass<typeof StatsStore>;
  let mockEngineInstance: jest.Mocked<ChessEngine>;
  let mockStatsStoreInstance: jest.Mocked<StatsStore>;
  let MockDrillSession: jest.MockedClass<typeof DrillSession>;
  let mockDrillSessionInstance: jest.Mocked<DrillSession>;

  let samplePgnData: ParsedPgn;
  let sampleVariationLine: VariationLine;

  beforeEach(() => {
    // Clear mock calls before each test
    // mockParse.mockClear(); // VariationParser is no longer directly used or mocked here
    // mockParse.mockReturnValue(undefined); // VariationParser is no longer directly used or mocked here

    // Setup PgnDataManager mock
    MockPgnDataManager = PgnDataManager as jest.MockedClass<
      typeof PgnDataManager
    >;
    mockPgnDataManagerInstance =
      createMockPgnDataManager() as jest.Mocked<PgnDataManager>; // Use helper
    MockPgnDataManager.mockImplementation(() => mockPgnDataManagerInstance);

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
        fen: jest
          .fn()
          .mockReturnValue(
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          ),
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

    // Clear ChessEngine mocks
    ChessEngine.mockClear();
    if (
      ChessEngine.mock.instances[0] &&
      ChessEngine.mock.instances[0].makeMove
    ) {
      ChessEngine.mock.instances[0].makeMove.mockClear();
    }
    // Setup a default mock implementation for ChessEngine for tests that need it
    const mockMakeMove = jest.fn();
    const mockGetFen = jest
      .fn()
      .mockReturnValue(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      ); // Default FEN
    const mockTurn = jest.fn().mockReturnValue('w'); // Default turn
    ChessEngine.mockImplementation(() => ({
      makeMove: mockMakeMove,
      game: {
        fen: mockGetFen,
        turn: mockTurn,
        // Add other methods like load, pgn, etc., if autoAdvanceToUserTurn or other logic needs them
        load: jest.fn(),
        pgn: jest.fn(),
        history: jest.fn().mockReturnValue([]),
        validateFen: jest.fn().mockReturnValue({ valid: true }),
        loadPgn: jest.fn(),
      },
      reset: jest.fn(),
      loadPgn: jest.fn(), // Mock for ChessEngine's loadPgn
      getHistory: jest.fn().mockReturnValue([]),
      getCurrentFen: mockGetFen, // If ChessEngine has its own getCurrentFen
    }));

    MockDrillSession = DrillSession as jest.MockedClass<typeof DrillSession>;
    mockDrillSessionInstance =
      createMockDrillSessionInstance() as jest.Mocked<DrillSession>;

    // Sample data for tests
    samplePgnData = {
      moves: [{ move: 'e4' }, { move: 'e5' }],
      tags: { Event: 'Test Game' },
      startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    };
    sampleVariationLine = {
      moves: [{ move: 'e4' }, { move: 'e5' }],
      tags: { Event: 'Test Game' },
      startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    };
  });

  test('constructor(): should be able to instantiate and initialize PgnDataManager, ChessEngine and StatsStore', () => {
    const orchestrator = new TrainingOrchestrator();
    expect(orchestrator).toBeDefined();
    expect(MockPgnDataManager).toHaveBeenCalledTimes(1); // Check PgnDataManager instantiation
    expect(MockChessEngine).toHaveBeenCalledTimes(1);
    expect(MockStatsStore).toHaveBeenCalledTimes(1);
    expect(orchestrator.statsStore).toBeDefined();
    expect(orchestrator.statsStore).toBeInstanceOf(MockStatsStore);
    // @ts-ignore access private member for test
    expect(orchestrator.pgnDataManager).toBeInstanceOf(MockPgnDataManager); // Check instance type
    // @ts-ignore access private member for test
    expect(orchestrator._engine).toBeInstanceOf(MockChessEngine);
    // @ts-ignore access private member for test
    expect(orchestrator._drillSession).toBeNull();
  });

  describe('loadPgn', () => {
    test('should throw an error if the PGN string is empty', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(() => orchestrator.loadPgn('')).toThrow(
        'PGN string cannot be empty.',
      );
      expect(mockPgnDataManagerInstance.loadPgn).not.toHaveBeenCalled(); // Ensure delegate not called for empty
    });

    test('should call PgnDataManager.loadPgn with the PGN string', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnString = '1. e4 e5';
      orchestrator.loadPgn(pgnString);
      expect(mockPgnDataManagerInstance.loadPgn).toHaveBeenCalledWith(
        pgnString,
      );
    });
  });

  describe('getParsedPgn', () => {
    test('should call PgnDataManager.getParsedPgn and return its result', () => {
      const orchestrator = new TrainingOrchestrator();
      const mockParsedPgn: ParsedPgn = { moves: [{ move: 'e4' }] }; // Example ParsedPgn
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(mockParsedPgn);

      const result = orchestrator.getParsedPgn();

      expect(mockPgnDataManagerInstance.getParsedPgn).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockParsedPgn);
    });

    test('should return null if PgnDataManager.getParsedPgn returns null', () => {
      const orchestrator = new TrainingOrchestrator();
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(null);
      const result = orchestrator.getParsedPgn();
      expect(result).toBeNull();
    });
  });

  describe('hasPgnLoaded', () => {
    test('should call PgnDataManager.hasPgnLoaded and return its result', () => {
      const orchestrator = new TrainingOrchestrator();
      mockPgnDataManagerInstance.hasPgnLoaded.mockReturnValue(true);
      expect(orchestrator.hasPgnLoaded()).toBe(true);
      expect(mockPgnDataManagerInstance.hasPgnLoaded).toHaveBeenCalledTimes(1);

      mockPgnDataManagerInstance.hasPgnLoaded.mockReturnValue(false);
      expect(orchestrator.hasPgnLoaded()).toBe(false);
    });
  });

  describe('generateVariationKey', () => {
    test('should call PgnDataManager.generateVariationKey and return its result', () => {
      const orchestrator = new TrainingOrchestrator();
      const moves: PgnMove[] = [{ move: 'e4' }, { move: 'e5' }];
      const expectedKey = 'e4_e5';
      // The mock for generateVariationKey is already set up by createMockPgnDataManager
      // to behave correctly. If specific behavior for this test is needed, override here.
      // mockPgnDataManagerInstance.generateVariationKey.mockReturnValue(expectedKey);

      const key = orchestrator.generateVariationKey(moves);
      expect(
        mockPgnDataManagerInstance.generateVariationKey,
      ).toHaveBeenCalledWith(moves);
      expect(key).toBe(expectedKey);
    });

    test('should handle empty move sequence by delegating', () => {
      const orchestrator = new TrainingOrchestrator();
      const moves: PgnMove[] = [];
      // mockPgnDataManagerInstance.generateVariationKey.mockReturnValue(''); // Default mock handles this
      const key = orchestrator.generateVariationKey(moves);
      expect(
        mockPgnDataManagerInstance.generateVariationKey,
      ).toHaveBeenCalledWith(moves);
      expect(key).toBe('');
    });
  });

  // New describe block for flattenVariations
  describe('flattenVariations', () => {
    let orchestrator: TrainingOrchestrator;

    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('should call PgnDataManager.flattenVariations and return its result', () => {
      const parsedPgn: ParsedPgn = { moves: [{ move: 'e4' }, { move: 'e5' }] };
      const mockFlatVariations: VariationLine[] = [
        { moves: [{ move: 'e4' }, { move: 'e5' }] },
      ];
      mockPgnDataManagerInstance.flattenVariations.mockReturnValue(
        mockFlatVariations,
      );

      const result = orchestrator.flattenVariations(parsedPgn);

      expect(mockPgnDataManagerInstance.flattenVariations).toHaveBeenCalledWith(
        parsedPgn,
      );
      expect(result).toEqual(mockFlatVariations);
    });

    test('should return an empty array if PgnDataManager.flattenVariations returns an empty array', () => {
      const parsedPgn: ParsedPgn = { moves: [] }; // Example with no moves
      mockPgnDataManagerInstance.flattenVariations.mockReturnValue([]);
      const result = orchestrator.flattenVariations(parsedPgn);
      expect(result).toEqual([]);
    });

    test('should pass null to PgnDataManager.flattenVariations if input is null', () => {
      mockPgnDataManagerInstance.flattenVariations.mockReturnValue([]); // Default behavior for null
      const result = orchestrator.flattenVariations(null);
      expect(mockPgnDataManagerInstance.flattenVariations).toHaveBeenCalledWith(
        null,
      );
      expect(result).toEqual([]);
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
      const mockParsedPgn: ParsedPgn = {
        moves: [{ move: 'e4' }, { move: 'e5' }],
        result: '*',
        tags: {},
      };
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(mockParsedPgn);
      orchestrator.loadPgn(pgnString);
      expect(orchestrator.hasPgnLoaded()).toBe(true);
    });

    test('should return false if PGN loading resulted in null (invalid PGN)', () => {
      const orchestrator = new TrainingOrchestrator();
      const pgnString = 'invalid pgn';
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(null);
      orchestrator.loadPgn(pgnString);
      expect(orchestrator.hasPgnLoaded()).toBe(false);
    });
  });

  describe('generateVariationKey', () => {
    test('should generate a consistent key for a sequence of moves', () => {
      const orchestrator = new TrainingOrchestrator();
      const moves: PgnMove[] = [
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
      const moves1: PgnMove[] = [{ move: 'e4' }, { move: 'e5' }];
      const moves2: PgnMove[] = [{ move: 'd4' }, { move: 'd5' }];
      const key1 = orchestrator.generateVariationKey(moves1);
      const key2 = orchestrator.generateVariationKey(moves2);
      expect(key1).not.toBe(key2);
    });

    test('should handle empty move sequence', () => {
      const orchestrator = new TrainingOrchestrator();
      const moves: PgnMove[] = [];
      const key = orchestrator.generateVariationKey(moves);
      expect(key).toBe('');
    });

    test("should generate a key based only on the 'move' property", () => {
      const orchestrator = new TrainingOrchestrator();
      const moves1: PgnMove[] = [
        { move: 'e4', comment: 'A comment' },
        { move: 'e5' },
      ];
      const moves2: PgnMove[] = [{ move: 'e4' }, { move: 'e5' }];
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
        tags: { White: 'User' },
      };
      const expectedFlatVariations: VariationLine[] = [
        {
          moves: [{ move: 'e4' }, { move: 'e5' }, { move: 'Nf3' }],
          tags: { White: 'User' },
        },
      ];
      expect(orchestrator.flattenVariations(parsedPgn)).toEqual(
        expectedFlatVariations,
      );
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
        },
        {
          moves: [{ move: 'd5' }, { move: 'exd5' }],
          tags: { Event: 'Test Game' },
        },
      ];
      const result = orchestrator
        .flattenVariations(parsedPgn)
        .sort((a, b) => a.moves[0].move.localeCompare(b.moves[0].move));
      expect(result).toEqual(
        expectedFlatVariations.sort((a, b) =>
          a.moves[0].move.localeCompare(b.moves[0].move),
        ),
      );
    });

    test('should flatten a PGN with a RAV deeper in the main line', () => {
      const parsedPgn: ParsedPgn = {
        moves: [
          { move: 'e4' },
          { move: 'e5' },
          { move: 'Nf3', rav: [{ moves: [{ move: 'Nc6' }, { move: 'Bb5' }] }] },
          { move: 'Bc4' },
        ],
      };
      const expectedFlatVariations: VariationLine[] = [
        {
          moves: [
            { move: 'e4' },
            { move: 'e5' },
            { move: 'Nf3' },
            { move: 'Bc4' },
          ],
          tags: undefined,
        },
        {
          moves: [
            { move: 'e4' },
            { move: 'e5' },
            { move: 'Nc6' },
            { move: 'Bb5' },
          ],
          tags: undefined,
        },
      ];
      const result = orchestrator
        .flattenVariations(parsedPgn)
        .sort((a, b) => a.moves[2].move.localeCompare(b.moves[2].move));
      expect(result).toEqual(
        expectedFlatVariations.sort((a, b) =>
          a.moves[2].move.localeCompare(b.moves[2].move),
        ),
      );
    });

    test('should handle multiple RAVs at the same level', () => {
      const parsedPgn: ParsedPgn = {
        moves: [
          {
            move: 'e4',
            rav: [{ moves: [{ move: 'c5' }] }, { moves: [{ move: 'e5' }] }],
          },
        ],
      };
      const expectedFlatVariations: VariationLine[] = [
        { moves: [{ move: 'e4' }], tags: undefined },
        { moves: [{ move: 'c5' }], tags: undefined },
        { moves: [{ move: 'e5' }], tags: undefined },
      ];
      const result = orchestrator
        .flattenVariations(parsedPgn)
        .sort((a, b) => a.moves[0].move.localeCompare(b.moves[0].move));
      expect(result).toEqual(
        expectedFlatVariations.sort((a, b) =>
          a.moves[0].move.localeCompare(b.moves[0].move),
        ),
      );
    });

    test('should flatten deeply nested RAVs', () => {
      const parsedPgn: ParsedPgn = {
        moves: [
          {
            move: 'e4',
            rav: [
              {
                moves: [
                  { move: 'c5' },
                  { move: 'Nf3', rav: [{ moves: [{ move: 'd6' }] }] },
                ],
              },
            ],
          },
          { move: 'd4' },
        ],
      };
      const expectedFlatVariations: VariationLine[] = [
        { moves: [{ move: 'e4' }, { move: 'd4' }], tags: undefined },
        { moves: [{ move: 'c5' }, { move: 'Nf3' }], tags: undefined },
        { moves: [{ move: 'c5' }, { move: 'd6' }], tags: undefined },
      ];
      const result = orchestrator.flattenVariations(parsedPgn).sort((a, b) => {
        const len = Math.min(a.moves.length, b.moves.length);
        for (let i = 0; i < len; i++) {
          if (a.moves[i].move !== b.moves[i].move)
            return a.moves[i].move.localeCompare(b.moves[i].move);
        }
        return a.moves.length - b.moves.length;
      });
      const expectedSorted = expectedFlatVariations.sort((a, b) => {
        const len = Math.min(a.moves.length, b.moves.length);
        for (let i = 0; i < len; i++) {
          if (a.moves[i].move !== b.moves[i].move)
            return a.moves[i].move.localeCompare(b.moves[i].move);
        }
        return a.moves.length - b.moves.length;
      });
      expect(result).toEqual(expectedSorted);
    });

    test('should include comments and NAGs in flattened variations if they exist on moves', () => {
      const parsedPgn: ParsedPgn = {
        moves: [
          { move: 'e4', comment: 'Good move' },
          {
            move: 'e5',
            nag: ['$1'],
            rav: [{ moves: [{ move: 'd5', comment: 'Alternative' }] }],
          },
        ],
      };
      const expectedFlatVariations: VariationLine[] = [
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
    let orchestrator: TrainingOrchestrator;
    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      mockPgnDataManagerInstance.hasPgnLoaded.mockReturnValue(true);
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(samplePgnData);
      mockPgnDataManagerInstance.flattenVariations.mockReturnValue([
        sampleVariationLine,
      ]);
      // Mock the DrillSession constructor to return our mock instance
      MockDrillSession.mockImplementation(() => mockDrillSessionInstance);
    });

    test('should throw error if PGN not loaded', () => {
      mockPgnDataManagerInstance.hasPgnLoaded.mockReturnValue(false);
      expect(() => orchestrator.startTrainingSession()).toThrow(
        'PGN not loaded',
      );
    });

    test('should throw error if parsed PGN is null', () => {
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(null);
      expect(() => orchestrator.startTrainingSession()).toThrow(
        'PGN data is null',
      );
    });

    test('should throw error if no variations found', () => {
      mockPgnDataManagerInstance.flattenVariations.mockReturnValue([]);
      expect(() => orchestrator.startTrainingSession()).toThrow(
        'No variations found',
      );
    });

    test('should create and store a DrillSession instance', () => {
      orchestrator.startTrainingSession('w');
      expect(MockDrillSession).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(orchestrator._drillSession).toBe(mockDrillSessionInstance);
    });

    test('should instantiate DrillSession with selected variation, user color, and starting FEN', () => {
      const determinedColor = 'w';
      jest
        .spyOn(orchestrator, 'determineUserColor')
        .mockReturnValue(determinedColor);
      jest
        .spyOn(orchestrator, 'selectRandomVariation')
        .mockReturnValue(sampleVariationLine);

      orchestrator.startTrainingSession(); // No userPlaysAs, so determineUserColor will be called

      expect(orchestrator.selectRandomVariation).toHaveBeenCalledWith([
        sampleVariationLine,
      ]);
      expect(orchestrator.determineUserColor).toHaveBeenCalledWith(
        sampleVariationLine,
      );
      expect(MockDrillSession).toHaveBeenCalledWith(
        sampleVariationLine,
        determinedColor,
        sampleVariationLine.startingFEN,
      );
    });

    test('should use userPlaysAs color if provided, overriding determinedUserColor', () => {
      const userPlaysAsColor = 'b';
      jest
        .spyOn(orchestrator, 'selectRandomVariation')
        .mockReturnValue(sampleVariationLine);
      const determineUserColorSpy = jest.spyOn(
        orchestrator,
        'determineUserColor',
      );

      orchestrator.startTrainingSession(userPlaysAsColor);

      expect(determineUserColorSpy).not.toHaveBeenCalled();
      expect(MockDrillSession).toHaveBeenCalledWith(
        sampleVariationLine,
        userPlaysAsColor,
        sampleVariationLine.startingFEN,
      );
    });

    test('should throw if user color cannot be determined and is not provided', () => {
      jest.spyOn(orchestrator, 'determineUserColor').mockReturnValue(undefined);
      expect(() => orchestrator.startTrainingSession()).toThrow(
        'Could not determine user color',
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
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(mockParsedPgn);
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
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(mockParsedPgn);
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
    test('should return undefined if no drill session', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(orchestrator.getCurrentFen()).toBeUndefined();
    });
    test('should return FEN from DrillSession', () => {
      const orchestrator = new TrainingOrchestrator();
      // @ts-ignore
      orchestrator._drillSession = mockDrillSessionInstance;
      mockDrillSessionInstance.getCurrentFen.mockReturnValue('test_fen');
      expect(orchestrator.getCurrentFen()).toBe('test_fen');
      expect(mockDrillSessionInstance.getCurrentFen).toHaveBeenCalledTimes(1);
    });
  });

  describe('getExpectedMoveForCurrentUser', () => {
    test('should return undefined if no drill session', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(orchestrator.getExpectedMoveForCurrentUser()).toBeUndefined();
    });
    test('should return move from DrillSession', () => {
      const orchestrator = new TrainingOrchestrator();
      // @ts-ignore
      orchestrator._drillSession = mockDrillSessionInstance;
      const expectedMove: PgnMove = { move: 'Nf3' };
      mockDrillSessionInstance.getExpectedMove.mockReturnValue(expectedMove);
      expect(orchestrator.getExpectedMoveForCurrentUser()).toEqual(
        expectedMove,
      );
      expect(mockDrillSessionInstance.getExpectedMove).toHaveBeenCalledTimes(1);
    });
  });

  describe('isUserTurn', () => {
    test('should return false if no drill session', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(orchestrator.isUserTurn()).toBe(false);
    });
    test('should return value from DrillSession', () => {
      const orchestrator = new TrainingOrchestrator();
      // @ts-ignore
      orchestrator._drillSession = mockDrillSessionInstance;
      mockDrillSessionInstance.isUserTurn.mockReturnValue(true);
      expect(orchestrator.isUserTurn()).toBe(true);
      expect(mockDrillSessionInstance.isUserTurn).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleUserMove', () => {
    let orchestrator: TrainingOrchestrator;
    const userMoveInput = { from: 'e2', to: 'e4' };

    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
      // @ts-ignore // Setup active session
      orchestrator._drillSession = mockDrillSessionInstance;
      // Mock getVariation and generateVariationKey for stats recording
      mockDrillSessionInstance.getVariation.mockReturnValue(
        sampleVariationLine,
      );
      mockPgnDataManagerInstance.generateVariationKey.mockReturnValue(
        'test_key',
      );
    });

    test('should throw if no active drill session', () => {
      // @ts-ignore
      orchestrator._drillSession = null;
      expect(() => orchestrator.handleUserMove(userMoveInput)).toThrow(
        'No active training session',
      );
    });

    test('should call DrillSession.handleUserMove with the input', () => {
      orchestrator.handleUserMove(userMoveInput);
      expect(mockDrillSessionInstance.handleUserMove).toHaveBeenCalledWith(
        userMoveInput,
      );
    });

    test('should record stats as success if move is correct', () => {
      mockDrillSessionInstance.handleUserMove.mockReturnValue({
        success: true,
        isCorrectMove: true,
        newFen: 'fen1',
        isComplete: false,
        opponentMove: null,
      });
      orchestrator.handleUserMove(userMoveInput);
      expect(mockStatsStoreInstance.recordResult).toHaveBeenCalledWith(
        'test_key',
        true,
      );
    });

    test('should record stats as failure if move is incorrect but valid on board', () => {
      mockDrillSessionInstance.handleUserMove.mockReturnValue({
        success: true,
        isCorrectMove: false,
        newFen: 'fen1',
        isComplete: false,
        opponentMove: null,
      });
      orchestrator.handleUserMove(userMoveInput);
      expect(mockStatsStoreInstance.recordResult).toHaveBeenCalledWith(
        'test_key',
        false,
      );
    });

    test('should not record stats if DrillSession.handleUserMove indicates success:false (illegal move)', () => {
      mockDrillSessionInstance.handleUserMove.mockReturnValue({
        success: false,
        isCorrectMove: false,
        newFen: 'fen1',
        isComplete: false,
        opponentMove: null,
      });
      orchestrator.handleUserMove(userMoveInput);
      expect(mockStatsStoreInstance.recordResult).not.toHaveBeenCalled();
    });

    test('should return the mapped result from DrillSession.handleUserMove', () => {
      const drillResult = {
        success: true,
        isCorrectMove: true,
        newFen: 'new_fen_here',
        opponentMove: { move: 'Nf6' },
        isComplete: true,
      };
      mockDrillSessionInstance.handleUserMove.mockReturnValue(drillResult);
      const expectedPgnMove: PgnMove = { move: 'e4' }; // from sampleVariationLine[0]
      mockDrillSessionInstance.getExpectedMove.mockReturnValueOnce(
        expectedPgnMove,
      );

      const result = orchestrator.handleUserMove(userMoveInput);

      expect(result.isValid).toBe(drillResult.success);
      expect(result.isCorrectMove).toBe(drillResult.isCorrectMove);
      expect(result.nextFen).toBe(drillResult.newFen);
      expect(result.opponentMove).toEqual(drillResult.opponentMove);
      expect(result.isVariationComplete).toBe(drillResult.isComplete);
      expect(result.expectedMoveSan).toBe(expectedPgnMove.move);
    });
  });

  describe('isDrillComplete', () => {
    test('should return false if no drill session', () => {
      const orchestrator = new TrainingOrchestrator();
      expect(orchestrator.isDrillComplete()).toBe(false);
    });
    test('should return value from DrillSession.isDrillComplete', () => {
      const orchestrator = new TrainingOrchestrator();
      // @ts-ignore
      orchestrator._drillSession = mockDrillSessionInstance;
      mockDrillSessionInstance.isDrillComplete.mockReturnValue(true);
      expect(orchestrator.isDrillComplete()).toBe(true);
      expect(mockDrillSessionInstance.isDrillComplete).toHaveBeenCalledTimes(1);
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

  // Tests for PgnDataManager delegation (loadPgn, getParsedPgn, etc.)
  // These were covered in the previous step but ensure they are correct.
  describe('PgnDataManager delegation', () => {
    let orchestrator: TrainingOrchestrator;
    const pgnString = '1. e4 e5';
    const parsedPgn: ParsedPgn = {
      moves: [{ move: 'e4' }],
      tags: {},
      startingFEN: '',
    };
    const movesArray: MoveForVariationKey[] = [{ move: 'e4' }];

    beforeEach(() => {
      orchestrator = new TrainingOrchestrator();
    });

    test('loadPgn should delegate to PgnDataManager.loadPgn', () => {
      orchestrator.loadPgn(pgnString);
      expect(mockPgnDataManagerInstance.loadPgn).toHaveBeenCalledWith(
        pgnString,
      );
    });

    test('getParsedPgn should delegate to PgnDataManager.getParsedPgn', () => {
      mockPgnDataManagerInstance.getParsedPgn.mockReturnValue(parsedPgn);
      const result = orchestrator.getParsedPgn();
      expect(mockPgnDataManagerInstance.getParsedPgn).toHaveBeenCalled();
      expect(result).toEqual(parsedPgn);
    });

    test('hasPgnLoaded should delegate to PgnDataManager.hasPgnLoaded', () => {
      mockPgnDataManagerInstance.hasPgnLoaded.mockReturnValue(true);
      const result = orchestrator.hasPgnLoaded();
      expect(mockPgnDataManagerInstance.hasPgnLoaded).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('generateVariationKey should delegate to PgnDataManager.generateVariationKey', () => {
      mockPgnDataManagerInstance.generateVariationKey.mockReturnValue('e4_key');
      const result = orchestrator.generateVariationKey(movesArray);
      expect(
        mockPgnDataManagerInstance.generateVariationKey,
      ).toHaveBeenCalledWith(movesArray);
      expect(result).toBe('e4_key');
    });

    test('flattenVariations should delegate to PgnDataManager.flattenVariations', () => {
      const flatVars: VariationLine[] = [sampleVariationLine];
      mockPgnDataManagerInstance.flattenVariations.mockReturnValue(flatVars);
      const result = orchestrator.flattenVariations(parsedPgn);
      expect(mockPgnDataManagerInstance.flattenVariations).toHaveBeenCalledWith(
        parsedPgn,
      );
      expect(result).toEqual(flatVars);
    });
  });
});
