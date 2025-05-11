import { Moves } from './moves';
import { Some, None } from 'ts-results';

describe('Moves', () => {
  const move1 = 'e4';
  const move2 = 'Nf3';
  const move3 = 'O-O';

  describe('constructor and getMoves', () => {
    it('should store and return the moves array', () => {
      const moves = new Moves([move1, move2, move3]);
      expect(moves.getMoves()).toEqual([move1, move2, move3]);
    });

    it('should handle an empty moves array', () => {
      const moves = new Moves([]);
      expect(moves.getMoves()).toEqual([]);
    });
  });

  describe('get', () => {
    let moves: Moves;
    beforeEach(() => {
      moves = new Moves([move1, move2, move3]);
    });

    it('should return Some(move) for valid indices', () => {
      expect(moves.get(0)).toEqual(Some(move1));
      expect(moves.get(1)).toEqual(Some(move2));
      expect(moves.get(2)).toEqual(Some(move3));
    });

    it('should return None for negative indices', () => {
      expect(moves.get(-1)).toBe(None);
    });

    it('should return None for out-of-bounds indices', () => {
      expect(moves.get(3)).toBe(None);
      expect(moves.get(100)).toBe(None);
    });

    it('should return None for empty moves array', () => {
      const emptyMoves = new Moves([]);
      expect(emptyMoves.get(0)).toBe(None);
    });
  });
});
