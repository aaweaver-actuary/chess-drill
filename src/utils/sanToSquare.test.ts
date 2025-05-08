import sanToSquare from '@/utils/sanToSquare';
import { ChessSquare } from '@/enums/ChessSquare';
import { describe, test, expect } from '@jest/globals';

describe('sanToSquare', () => {
  test('should convert "a1" to ChessSquare.A1', () => {
    expect(sanToSquare('a1')).toBe(ChessSquare.A1);
  });

  test('should convert "h1" to ChessSquare.H1', () => {
    expect(sanToSquare('h1')).toBe(ChessSquare.H1);
  });

  test('should convert "a8" to ChessSquare.A8', () => {
    expect(sanToSquare('a8')).toBe(ChessSquare.A8);
  });

  test('should convert "h8" to ChessSquare.H8', () => {
    expect(sanToSquare('h8')).toBe(ChessSquare.H8);
  });

  test('should convert "e4" to ChessSquare.E4', () => {
    expect(sanToSquare('e4')).toBe(ChessSquare.E4);
  });

  test('should convert "d5" to ChessSquare.D5', () => {
    expect(sanToSquare('d5')).toBe(ChessSquare.D5);
  });

  test('should convert "c3" to ChessSquare.C3', () => {
    expect(sanToSquare('c3')).toBe(ChessSquare.C3);
  });

  test('should convert "f6" to ChessSquare.F6', () => {
    expect(sanToSquare('f6')).toBe(ChessSquare.F6);
  });
});