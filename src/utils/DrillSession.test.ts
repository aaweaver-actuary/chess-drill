// src/utils/DrillSession.test.ts
import { DrillSession } from './DrillSession';
import { ChessEngine } from './ChessEngine';
import { VariationLine, PgnMove } from '@/types/pgnTypes';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock ChessEngine
jest.mock('./ChessEngine');

const mockMakeMove = jest.fn();
const mockLoad = jest.fn();
const mockReset = jest.fn();
const mockFen = jest
  .fn()
  .mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); // Default FEN
const mockTurn = jest.fn().mockReturnValue('w'); // Default turn
const mockMoveToSan = jest
  .fn()
  .mockImplementation((move) => `${move.from}-${move.to}`);

// Helper to create a mock ChessEngine instance
const createMockChessEngineInstance = () => ({
  makeMove: mockMakeMove,
  load: mockLoad,
  reset: mockReset,
  game: {
    fen: mockFen,
    turn: mockTurn,
  },
  moveToSan: mockMoveToSan, // Add the mock for moveToSan
});

describe('DrillSession', () => {
  let mockChessEngineInstance: jest.Mocked<ChessEngine>;
  let sampleVariation: VariationLine;

  beforeEach(() => {
    // Reset all mock implementations and calls
    mockMakeMove.mockClear();
    mockLoad.mockClear();
    mockReset.mockClear();
    mockFen
      .mockClear()
      .mockReturnValue(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      );
    mockTurn.mockClear().mockReturnValue('w');
    mockMoveToSan
      .mockClear()
      .mockImplementation((move) => `${move.from}-${move.to}`);

    // Create a fresh mock instance for each test
    mockChessEngineInstance =
      createMockChessEngineInstance() as jest.Mocked<ChessEngine>;
    (ChessEngine as jest.MockedClass<typeof ChessEngine>).mockImplementation(
      () => mockChessEngineInstance,
    );

    sampleVariation = {
      moves: [
        { move: 'e4', from: 'e2', to: 'e4' }, // User (White)
        { move: 'e5', from: 'e7', to: 'e5' }, // Opponent (Black)
        { move: 'Nf3', from: 'g1', to: 'f3' }, // User (White)
        { move: 'Nc6', from: 'b8', to: 'c6' }, // Opponent (Black)
      ],
      tags: { Event: 'Test Drill' },
      startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Standard start
    };
  });

  test('constructor should initialize ChessEngine and properties', () => {
    const drill = new DrillSession(sampleVariation, 'w');
    expect(ChessEngine).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalled(); // Default FEN means reset is called
    expect(drill.getCurrentFen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    // @ts-ignore // Access private for test
    expect(drill.variation).toEqual(sampleVariation);
    // @ts-ignore // Access private for test
    expect(drill.userColor).toBe('w');
    // @ts-ignore // Access private for test
    expect(drill.currentMoveIndex).toBe(0);
  });

  test('constructor should load initialFen if provided', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'; // After 1. e4
    sampleVariation.startingFEN = fen;
    const drill = new DrillSession(sampleVariation, 'b', fen);
    expect(mockLoad).toHaveBeenCalledWith(fen);
    expect(mockReset).not.toHaveBeenCalled();
  });

  describe('isUserTurn', () => {
    test("should return true if it is the user's turn", () => {
      mockTurn.mockReturnValue('w');
      const drill = new DrillSession(sampleVariation, 'w');
      expect(drill.isUserTurn()).toBe(true);
    });

    test("should return false if it is not the user's turn", () => {
      mockTurn.mockReturnValue('b');
      const drill = new DrillSession(sampleVariation, 'w');
      expect(drill.isUserTurn()).toBe(false);
    });

    test('should return false if drill is complete', () => {
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore
      drill.currentMoveIndex = sampleVariation.moves.length; // Manually set to complete
      expect(drill.isUserTurn()).toBe(false);
    });
  });

  describe('getExpectedMove', () => {
    test("should return the correct PgnMove if it is user's turn", () => {
      mockTurn.mockReturnValue('w');
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore
      drill.currentMoveIndex = 0;
      expect(drill.getExpectedMove()).toEqual(sampleVariation.moves[0]);
    });

    test("should return null if not user's turn", () => {
      mockTurn.mockReturnValue('b');
      const drill = new DrillSession(sampleVariation, 'w');
      expect(drill.getExpectedMove()).toBeNull();
    });

    test('should return null if drill is complete', () => {
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore
      drill.currentMoveIndex = sampleVariation.moves.length;
      expect(drill.getExpectedMove()).toBeNull();
    });
  });

  describe('handleUserMove', () => {
    test("should return not success if not user's turn", () => {
      mockTurn.mockReturnValue('b'); // Opponent's turn
      const drill = new DrillSession(sampleVariation, 'w');
      const result = drill.handleUserMove({ from: 'e2', to: 'e4' });
      expect(result.success).toBe(false);
      expect(result.isCorrectMove).toBe(false);
      expect(mockMakeMove).not.toHaveBeenCalled();
    });

    test('should return isCorrectMove: false for an incorrect move', () => {
      mockTurn.mockReturnValue('w'); // User's turn
      const drill = new DrillSession(sampleVariation, 'w');
      // Expected is e4 (e2-e4), user plays d4 (d2-d4)
      mockMoveToSan.mockReturnValueOnce('d2-d4'); // Mock SAN for the incorrect move
      const result = drill.handleUserMove({ from: 'd2', to: 'd4' });
      expect(result.success).toBe(true); // Success is true because the operation of handling the move completed
      expect(result.isCorrectMove).toBe(false);
      expect(mockMakeMove).not.toHaveBeenCalled();
      // @ts-ignore
      expect(drill.currentMoveIndex).toBe(0); // Move index should not advance
    });

    test('should handle correct user move, make move on engine, and advance index', () => {
      mockTurn.mockReturnValue('w'); // User's turn (White)
      const drill = new DrillSession(sampleVariation, 'w');
      const userMoveInput = { from: 'e2', to: 'e4' };
      mockMakeMove.mockReturnValueOnce({ san: 'e4', from: 'e2', to: 'e4' }); // Simulate successful engine move
      mockMoveToSan.mockReturnValueOnce('e4'); // Correct SAN for the move
      mockFen.mockReturnValueOnce('fen-after-e4'); // FEN after user's move

      // Simulate opponent's turn after user's move for the next part of the logic
      mockTurn.mockReturnValueOnce('b');
      // Simulate opponent's move being made
      mockMakeMove.mockReturnValueOnce({ san: 'e5', from: 'e7', to: 'e5' });
      mockFen.mockReturnValueOnce('fen-after-e4-e5'); // FEN after opponent's move
      mockTurn.mockReturnValueOnce('w'); // Back to user's turn

      const result = drill.handleUserMove(userMoveInput);

      expect(result.success).toBe(true);
      expect(result.isCorrectMove).toBe(true);
      expect(mockMakeMove).toHaveBeenCalledWith(userMoveInput); // User's move
      // @ts-ignore
      expect(drill.currentMoveIndex).toBe(2); // Advanced past user and opponent move
      expect(result.newFen).toBe('fen-after-e4-e5');
      expect(result.opponentMove).toEqual(sampleVariation.moves[1]); // e5
      expect(result.isComplete).toBe(false);
    });

    test('should handle correct final user move and mark drill as complete', () => {
      mockTurn.mockReturnValue('w'); // User's turn (White)
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore // Manually set index to the last user move
      drill.currentMoveIndex = 2; // User to play Nf3 (sampleVariation.moves[2])

      const finalUserMove = { from: 'g1', to: 'f3' };
      mockMakeMove.mockReturnValueOnce({ san: 'Nf3', from: 'g1', to: 'f3' });
      mockMoveToSan.mockReturnValueOnce('Nf3');
      mockFen.mockReturnValueOnce('fen-after-Nf3');
      mockTurn.mockReturnValueOnce('b'); // Opponent's turn after user's move

      // Opponent makes their final move
      mockMakeMove.mockReturnValueOnce({ san: 'Nc6', from: 'b8', to: 'c6' });
      mockFen.mockReturnValueOnce('fen-after-Nf3-Nc6');

      const result = drill.handleUserMove(finalUserMove);

      expect(result.success).toBe(true);
      expect(result.isCorrectMove).toBe(true);
      expect(mockMakeMove).toHaveBeenCalledWith(finalUserMove);
      expect(result.opponentMove).toEqual(sampleVariation.moves[3]); // Nc6
      // @ts-ignore
      expect(drill.currentMoveIndex).toBe(sampleVariation.moves.length); // Index is at the end
      expect(result.isComplete).toBe(true);
      expect(result.newFen).toBe('fen-after-Nf3-Nc6');
    });

    test('should handle correct user move when it is the last move of the variation (no opponent reply)', () => {
      const shortVariation: VariationLine = {
        moves: [{ move: 'e4', from: 'e2', to: 'e4' }], // Only one move
        startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      };
      mockTurn.mockReturnValue('w');
      const drill = new DrillSession(shortVariation, 'w');
      const userMoveInput = { from: 'e2', to: 'e4' };
      mockMakeMove.mockReturnValueOnce({ san: 'e4', from: 'e2', to: 'e4' });
      mockMoveToSan.mockReturnValueOnce('e4');
      mockFen.mockReturnValueOnce('fen-after-final-e4');

      const result = drill.handleUserMove(userMoveInput);

      expect(result.success).toBe(true);
      expect(result.isCorrectMove).toBe(true);
      expect(mockMakeMove).toHaveBeenCalledWith(userMoveInput);
      // @ts-ignore
      expect(drill.currentMoveIndex).toBe(1);
      expect(result.opponentMove).toBeUndefined();
      expect(result.isComplete).toBe(true);
      expect(result.newFen).toBe('fen-after-final-e4');
    });

    test('should return success:false if engine fails to make a supposedly correct move', () => {
      mockTurn.mockReturnValue('w');
      const drill = new DrillSession(sampleVariation, 'w');
      const userMoveInput = { from: 'e2', to: 'e4' };
      mockMakeMove.mockReturnValueOnce(null); // Simulate engine failure
      mockMoveToSan.mockReturnValueOnce('e4');

      const result = drill.handleUserMove(userMoveInput);
      expect(result.success).toBe(false);
      expect(result.isCorrectMove).toBe(false); // If engine fails, it wasn't truly correct/legal in that context
      // @ts-ignore
      expect(drill.currentMoveIndex).toBe(0); // Index should not advance
    });

    test("should handle scenario where opponent's scripted move is illegal", () => {
      mockTurn.mockReturnValue('w'); // User's turn
      const drill = new DrillSession(sampleVariation, 'w');
      const userMoveInput = { from: 'e2', to: 'e4' };
      mockMakeMove.mockReturnValueOnce({ san: 'e4', from: 'e2', to: 'e4' }); // User move OK
      mockMoveToSan.mockReturnValueOnce('e4');
      mockFen.mockReturnValueOnce('fen-after-e4');
      mockTurn.mockReturnValueOnce('b'); // Opponent's turn

      // Simulate opponent's move failing
      mockMakeMove.mockReturnValueOnce(null);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = drill.handleUserMove(userMoveInput);

      expect(result.success).toBe(true); // User's part was successful
      expect(result.isCorrectMove).toBe(true);
      expect(result.opponentMove).toBeNull(); // Opponent move was not made
      // @ts-ignore
      expect(drill.currentMoveIndex).toBe(1); // Only user's move advanced index
      expect(result.newFen).toBe('fen-after-e4'); // FEN after user's move only
      expect(result.isComplete).toBe(false); // Drill is not complete as opponent move failed
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('isDrillComplete', () => {
    test('should return false if currentMoveIndex is less than total moves', () => {
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore
      drill.currentMoveIndex = 0;
      expect(drill.isDrillComplete()).toBe(false);
    });

    test('should return true if currentMoveIndex equals total moves', () => {
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore
      drill.currentMoveIndex = sampleVariation.moves.length;
      expect(drill.isDrillComplete()).toBe(true);
    });

    test('should return true if currentMoveIndex exceeds total moves (safety check)', () => {
      const drill = new DrillSession(sampleVariation, 'w');
      // @ts-ignore
      drill.currentMoveIndex = sampleVariation.moves.length + 1;
      expect(drill.isDrillComplete()).toBe(true);
    });
  });
});
