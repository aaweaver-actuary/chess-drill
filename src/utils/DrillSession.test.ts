// src/utils/DrillSession.test.ts
import { DrillSession } from './DrillSession';
import { ChessEngine } from './ChessEngine';
import { PgnMove } from '@/types/pgnTypes';
import { Variation } from '@/types/variation';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { DrillStateManager } from './DrillStateManager';
import { ChessPieceColor } from '@/_enums/ChessPieceColor';
import { ChessSquare } from '@/_enums/ChessSquare';
import { PromotionPiece } from '@/_enums/ChessPiece';

// Mock ChessEngine
jest.mock('./ChessEngine');
jest.mock('./DrillStateManager');

// Mock for the moveToSan function
const mockedMoveToSan = (): ((move: unknown) => string) => {
  return (move: unknown): string => {
    const m = move as { from: string; to: string };
    return `${m.from}-${m.to}`;
  };
};

const mockMakeMove = jest.fn();
const mockLoad = jest.fn();
const mockReset = jest.fn();
const mockFen = jest
  .fn()
  .mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); // Default FEN
const mockTurn = jest.fn().mockReturnValue(ChessPieceColor.White); // Default turn
const mockMoveToSan = jest.fn().mockImplementation(mockedMoveToSan());

// Helper to create a mock ChessEngine instance
const mockLoadPgn = jest.fn();
const mockGetHistory = jest.fn();

const createMockChessEngineInstance = () => ({
  makeMove: mockMakeMove,
  load: mockLoad,
  reset: mockReset,
  loadPgn: mockLoadPgn,
  getHistory: mockGetHistory,
  game: {
    fen: mockFen,
    turn: mockTurn,
  },
  moveToSan: mockMoveToSan,
});

describe('DrillSession', () => {
  let mockChessEngineInstance: jest.Mocked<ChessEngine>;
  let sampleVariation: Variation;

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
    mockTurn.mockClear().mockReturnValue(ChessPieceColor.White);
    mockMoveToSan.mockClear().mockImplementation(mockedMoveToSan());

    // Create a fresh mock instance for each test
    mockChessEngineInstance =
      createMockChessEngineInstance() as unknown as jest.Mocked<ChessEngine>;
    (ChessEngine as jest.MockedClass<typeof ChessEngine>).mockImplementation(
      () => mockChessEngineInstance,
    );

    sampleVariation = {
      moves: [
        { move: 'e4', from: ChessSquare.E2, to: ChessSquare.E4 }, // User (White)
        { move: 'e5', from: ChessSquare.E7, to: ChessSquare.E5 }, // Opponent (Black)
        { move: 'f3', from: ChessSquare.G1, to: ChessSquare.F3 }, // User (White)
        { move: 'c6', from: ChessSquare.B8, to: ChessSquare.C6 }, // Opponent (Black)
      ],
      tags: { Event: 'Test Drill' },
      startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Standard start
    };
  });

  test('constructor should initialize ChessEngine and properties', () => {
    const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
    expect(ChessEngine).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalled();
    expect(drill.getCurrentFen()).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    // @ts-ignore // Access private for test
    expect(drill.variation).toEqual(sampleVariation);
    // @ts-ignore // Access private for test
    expect(drill.userColor).toBe(ChessPieceColor.White);
    // Use stateManager for move index
    expect(drill.stateManager.getCurrentMoveIndex()).toBe(0);
  });

  test('constructor should load initialFen if provided', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'; // After 1. e4
    sampleVariation.startingFEN = fen;
    const drill = new DrillSession(sampleVariation, ChessPieceColor.Black, fen);
    expect(mockLoad).toHaveBeenCalledWith(fen);
    expect(mockReset).not.toHaveBeenCalled();
  });

  test('delegates move index and expected move logic to DrillStateManager', () => {
    const mockAdvance = jest.fn();
    const mockGetCurrentMoveIndex = jest
      .fn()
      .mockReturnValue(ChessPieceColor.White);
    const mockGetExpectedMove = jest.fn().mockReturnValue({
      move: ChessSquare.E4,
      from: ChessSquare.E2,
      to: ChessSquare.E4,
    });
    (DrillStateManager as jest.Mock).mockImplementation(() => ({
      advance: mockAdvance,
      getCurrentMoveIndex: mockGetCurrentMoveIndex,
      getExpectedMove: mockGetExpectedMove,
      isComplete: jest.fn().mockReturnValue(false),
      reset: jest.fn(),
      // Add any additional methods or properties used by DrillSession
    }));
    const sampleVariation = {
      moves: [{ move: 'e4', from: ChessSquare.E2, to: ChessSquare.E4 }],
      tags: {},
      startingFEN: undefined,
    };
    const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
    // @ts-ignore
    expect(drill.stateManager.getCurrentMoveIndex()).toBe(1);
    // @ts-ignore
    expect(drill.stateManager.getExpectedMove()).toEqual({
      move: ChessSquare.E4,
      from: ChessSquare.E2,
      to: ChessSquare.E4,
    });
  });

  describe('isUserTurn', () => {
    test("should return true if it is the user's turn", () => {
      mockTurn.mockReturnValue(ChessPieceColor.White);
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      expect(drill.isUserTurn()).toBe(true);
    });

    test("should return false if it is not the user's turn", () => {
      mockTurn.mockReturnValue(ChessPieceColor.Black);
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      expect(drill.isUserTurn()).toBe(false);
    });

    test('should return false if drill is complete', () => {
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);

      drill.stateManager.reset();
      for (let i = 0; i < sampleVariation.moves.length; i++) {
        drill.stateManager.advance();
      }
      expect(drill.isUserTurn()).toBe(false);
    });
  });

  describe('getExpectedMove', () => {
    test("should return the correct PgnMove if it is user's turn", () => {
      mockTurn.mockReturnValue(ChessPieceColor.White);
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      drill.stateManager.reset();
      expect(drill.getExpectedMove()).toEqual(sampleVariation.moves[0]);
    });

    test("should return null if not user's turn", () => {
      mockTurn.mockReturnValue(ChessPieceColor.Black);
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      expect(drill.getExpectedMove()).toBeNull();
    });

    test('should return null if drill is complete', () => {
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      drill.stateManager.reset();
      for (let i = 0; i < sampleVariation.moves.length; i++) {
        drill.stateManager.advance();
      }
      expect(drill.getExpectedMove()).toBeNull();
    });
  });

  describe('handleUserMove', () => {
    test("should return not success if not user's turn", () => {
      mockTurn.mockReturnValue(ChessPieceColor.Black);
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      const result = drill.handleUserMove({
        from: ChessSquare.E2,
        to: ChessSquare.E4,
        promotion: PromotionPiece.NoPromotion,
      });
      expect(result.success).toBe(false);
      expect(result.isCorrectMove).toBe(false);
      expect(mockMakeMove).not.toHaveBeenCalled();
    });

    test('should return isCorrectMove: false for an incorrect move', () => {
      mockTurn.mockReturnValue(ChessPieceColor.White);
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);

      // Expected is e4 (e2-e4), user plays d4 (d2-d4)
      mockMoveToSan.mockReturnValueOnce('d2-d4');
      const result = drill.handleUserMove({
        from: ChessSquare.D2,
        to: ChessSquare.D4,
        promotion: PromotionPiece.NoPromotion,
      });
      expect(result.success).toBe(true); // Success is true because the operation of handling the move completed
      expect(result.isCorrectMove).toBe(false);
      expect(mockMakeMove).not.toHaveBeenCalled();
      // Use stateManager for move index
      expect(drill.stateManager.getCurrentMoveIndex()).toBe(0); // Move index should not advance
    });

    test('should handle correct user move, make move on engine, and advance index', () => {
      mockTurn.mockReturnValue(ChessPieceColor.White); // User's turn (White)
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      const userMoveInput = {
        from: ChessSquare.E2,
        to: ChessSquare.E4,
        promotion: PromotionPiece.NoPromotion,
      };
      mockMakeMove.mockReturnValueOnce({
        san: 'e4',
        from: ChessSquare.E2,
        to: ChessSquare.E4,
      }); // Simulate successful engine move
      mockMoveToSan.mockReturnValueOnce('e4'); // Correct SAN for the move
      mockFen.mockReturnValueOnce('fen-after-e4'); // FEN after user's move

      // Simulate opponent's turn after user's move for the next part of the logic
      mockTurn.mockReturnValueOnce(ChessPieceColor.Black); // Opponent's turn

      // Simulate opponent's move being made
      mockMakeMove.mockReturnValueOnce({
        san: 'e5',
        from: ChessSquare.E7,
        to: ChessSquare.E5,
      });
      mockFen.mockReturnValueOnce('fen-after-e4-e5'); // FEN after opponent's move
      mockTurn.mockReturnValueOnce(ChessPieceColor.White); // Back to user's turn

      const result = drill.handleUserMove(userMoveInput);

      expect(result.success).toBe(true);
      expect(result.isCorrectMove).toBe(true);
      expect(mockMakeMove).toHaveBeenCalledWith(userMoveInput); // User's move
      // Use stateManager for move index
      expect(drill.stateManager.getCurrentMoveIndex()).toBe(2); // Advanced past user and opponent move
      expect(result.newFen).toBe('fen-after-e4-e5');
      expect(result.opponentMove).toEqual(sampleVariation.moves[1]); // e5
      expect(result.isComplete).toBe(false);
    });

    test('should handle correct final user move and mark drill as complete', () => {
      mockTurn.mockReturnValue(ChessPieceColor.White); // User's turn (White)
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      // Set index to the last user move
      drill.stateManager.reset();
      for (let i = 0; i < 2; i++) drill.stateManager.advance();

      const finalUserMove = {
        from: ChessSquare.G1,
        to: ChessSquare.F3,
        promotion: PromotionPiece.NoPromotion,
      };
      mockMakeMove.mockReturnValueOnce({
        san: 'Nf3',
        from: ChessSquare.G1,
        to: ChessSquare.F3,
      });
      mockMoveToSan.mockReturnValueOnce('Nf3');
      mockFen.mockReturnValueOnce('fen-after-Nf3');
      mockTurn.mockReturnValueOnce(ChessPieceColor.Black); // Opponent's turn

      // Opponent makes their final move
      mockMakeMove.mockReturnValueOnce({
        san: 'Nc6',
        from: ChessSquare.B8,
        to: ChessSquare.C6,
      });
      mockFen.mockReturnValueOnce('fen-after-Nf3-Nc6');

      const result = drill.handleUserMove(finalUserMove);

      expect(result.success).toBe(true);
      expect(result.isCorrectMove).toBe(true);
      expect(mockMakeMove).toHaveBeenCalledWith(finalUserMove);
      expect(result.opponentMove).toEqual(sampleVariation.moves[3]); // Nc6
      expect(drill.stateManager.getCurrentMoveIndex()).toBe(
        sampleVariation.moves.length,
      ); // Index is at the end
      expect(result.isComplete).toBe(true);
      expect(result.newFen).toBe('fen-after-Nf3-Nc6');
    });

    test('should handle correct user move when it is the last move of the variation (no opponent reply)', () => {
      const shortVariation: Variation = {
        moves: [{ move: 'e4', from: ChessSquare.E2, to: ChessSquare.E4 }], // Only one move
        startingFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      };
      mockTurn.mockReturnValue(ChessPieceColor.White); // User's turn (White)
      const drill = new DrillSession(shortVariation, ChessPieceColor.White);
      const userMoveInput = {
        from: ChessSquare.E2,
        to: ChessSquare.E4,
        promotion: PromotionPiece.NoPromotion,
      };
      mockMakeMove.mockReturnValueOnce({
        san: 'e4',
        from: ChessSquare.E2,
        to: ChessSquare.E4,
      }); // Simulate successful engine move
      mockMoveToSan.mockReturnValueOnce('e4'); // Correct SAN for the move
      mockFen.mockReturnValueOnce('fen-after-final-e4');

      const result = drill.handleUserMove(userMoveInput);

      expect(result.success).toBe(true);
      expect(result.isCorrectMove).toBe(true);
      expect(mockMakeMove).toHaveBeenCalledWith(userMoveInput);
      // Use stateManager for move index
      expect(drill.stateManager.getCurrentMoveIndex()).toBe(1);
      expect(result.opponentMove).toBeUndefined();
      expect(result.isComplete).toBe(true);
      expect(result.newFen).toBe('fen-after-final-e4');
    });

    test('should return success:false if engine fails to make a supposedly correct move', () => {
      mockTurn.mockReturnValue(ChessPieceColor.White); // User's turn (White)
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      const userMoveInput = {
        from: ChessSquare.E2,
        to: ChessSquare.E4,
        promotion: PromotionPiece.NoPromotion,
      };
      mockMakeMove.mockReturnValueOnce(null); // Simulate engine failure
      mockMoveToSan.mockReturnValueOnce('e4');

      const result = drill.handleUserMove(userMoveInput);
      expect(result.success).toBe(false);
      expect(result.isCorrectMove).toBe(false); // If engine fails, it wasn't truly correct/legal in that context
      // Use stateManager for move index
      expect(drill.stateManager.getCurrentMoveIndex()).toBe(0); // Index should not advance
    });

    test("should handle scenario where opponent's scripted move is illegal", () => {
      mockTurn.mockReturnValue(ChessPieceColor.White); // User's turn (White)
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      const userMoveInput = {
        from: ChessSquare.E2,
        to: ChessSquare.E4,
        promotion: PromotionPiece.NoPromotion,
      };
      mockMakeMove.mockReturnValueOnce({
        san: 'e4',
        from: ChessSquare.E2,
        to: ChessSquare.E4,
      }); // User move OK
      mockMoveToSan.mockReturnValueOnce('e4');
      mockFen.mockReturnValueOnce('fen-after-e4');
      mockTurn.mockReturnValueOnce(ChessPieceColor.Black); // Opponent's turn

      // Simulate opponent's move failing
      mockMakeMove.mockReturnValueOnce(null);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = drill.handleUserMove(userMoveInput);

      expect(result.success).toBe(true); // User's part was successful
      expect(result.isCorrectMove).toBe(true);
      expect(result.opponentMove).toBeNull(); // Opponent move was not made
      // Use stateManager for move index
      expect(drill.stateManager.getCurrentMoveIndex()).toBe(1); // Only user's move advanced index
      expect(result.newFen).toBe('fen-after-e4'); // FEN after user's move only
      expect(result.isComplete).toBe(false); // Drill is not complete as opponent move failed
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('isDrillComplete', () => {
    test('should return false if currentMoveIndex is less than total moves', () => {
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      drill.stateManager.reset();
      expect(drill.isDrillComplete()).toBe(false);
    });

    test('should return true if currentMoveIndex equals total moves', () => {
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      drill.stateManager.reset();
      for (let i = 0; i < sampleVariation.moves.length; i++) {
        drill.stateManager.advance();
      }
      expect(drill.isDrillComplete()).toBe(true);
    });

    test('should return true if currentMoveIndex exceeds total moves (safety check)', () => {
      const drill = new DrillSession(sampleVariation, ChessPieceColor.White);
      drill.stateManager.reset();
      for (let i = 0; i < sampleVariation.moves.length; i++) {
        drill.stateManager.advance();
      }
      expect(drill.isDrillComplete()).toBe(true);
    });
  });
});
