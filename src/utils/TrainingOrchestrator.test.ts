import { TrainingOrchestrator } from '@/utils/TrainingOrchestrator';
import { describe, test, expect } from '@jest/globals';

describe('TrainingOrchestrator', () => {
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
  });
});
