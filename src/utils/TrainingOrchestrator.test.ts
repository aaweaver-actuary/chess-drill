import { TrainingOrchestrator } from '@/utils/TrainingOrchestrator';
import { describe, test, expect, jest } from '@jest/globals'; // Import jest
import { VariationParser } from './VariationParser'; // Import VariationParser

// Mock VariationParser
jest.mock('./VariationParser');

const mockParse = jest.fn();
VariationParser.prototype.parse = mockParse;

// A helper type for the mock PGN data to ensure consistency
interface MockParsedPgnData {
  moves: { move: string }[];
  result: string;
  tags: Record<string, any>; // Allow any for tags in mock
}

describe('TrainingOrchestrator', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockParse.mockClear();
    // Reset mock return value for each test if necessary
    mockParse.mockReturnValue(undefined);
  });
  test('constructor(): should be able to instantiate', () => {
    const orchestrator = new TrainingOrchestrator();
    expect(orchestrator).toBeDefined();
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
          { move: 'e4',
            rav: [{ moves: [{move: 'd5'}, {move: 'exd5'}] }] // Simplified RAV structure
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
});
