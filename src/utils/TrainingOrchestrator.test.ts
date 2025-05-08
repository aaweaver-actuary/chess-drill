import { TrainingOrchestrator } from '@/utils/TrainingOrchestrator';
import { describe, test, expect, jest, beforeEach } from '@jest/globals'; // Import jest
import { VariationParser } from '@/utils/VariationParser'; // Import VariationParser

// Mock VariationParser
jest.mock('./VariationParser');

const mockParse = jest.fn();
VariationParser.prototype.parse = mockParse;

// A helper type for the mock PGN data to ensure consistency
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
});
