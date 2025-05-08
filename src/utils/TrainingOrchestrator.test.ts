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
});
