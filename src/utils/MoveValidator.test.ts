import { MoveValidator } from './MoveValidator';

describe('MoveValidator', () => {
  it('returns true for matching from/to', () => {
    const expected = { from: 'e2', to: 'e4' };
    const user = { from: 'e2', to: 'e4' };
    expect(MoveValidator.isMatch(expected, user)).toBe(true);
  });

  it('returns false for non-matching from/to', () => {
    const expected = { from: 'e2', to: 'e4' };
    const user = { from: 'd2', to: 'd4' };
    expect(MoveValidator.isMatch(expected, user)).toBe(false);
  });

  it('returns true for matching from/to/promotion', () => {
    const expected = { from: 'e7', to: 'e8', promotion: 'q' };
    const user = { from: 'e7', to: 'e8', promotion: 'q' };
    expect(MoveValidator.isMatch(expected, user)).toBe(true);
  });

  it('returns false if promotion does not match', () => {
    const expected = { from: 'e7', to: 'e8', promotion: 'q' };
    const user = { from: 'e7', to: 'e8', promotion: 'n' };
    expect(MoveValidator.isMatch(expected, user)).toBe(false);
  });

  it('returns true for matching SAN', () => {
    const expected = { move: 'Nf3' };
    const user = { move: 'Nf3' };
    expect(MoveValidator.isMatch(expected, user)).toBe(true);
  });

  it('returns false for non-matching SAN', () => {
    const expected = { move: 'Nf3' };
    const user = { move: 'Nc3' };
    expect(MoveValidator.isMatch(expected, user)).toBe(false);
  });
});
