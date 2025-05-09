import { DrillStateManager } from './DrillStateManager';

describe('DrillStateManager', () => {
  const moves = [
    { move: 'e4', from: 'e2', to: 'e4' },
    { move: 'e5', from: 'e7', to: 'e5' },
    { move: 'Nf3', from: 'g1', to: 'f3' },
    { move: 'Nc6', from: 'b8', to: 'c6' },
  ];

  it('initializes with move index 0', () => {
    const manager = new DrillStateManager(moves);
    expect(manager.getCurrentMoveIndex()).toBe(0);
  });

  it('returns the expected move for the current index', () => {
    const manager = new DrillStateManager(moves);
    expect(manager.getExpectedMove()).toEqual(moves[0]);
  });

  it('can advance to the next move', () => {
    const manager = new DrillStateManager(moves);
    manager.advance();
    expect(manager.getCurrentMoveIndex()).toBe(1);
    expect(manager.getExpectedMove()).toEqual(moves[1]);
  });

  it('knows when the drill is complete', () => {
    const manager = new DrillStateManager(moves);
    for (let i = 0; i < moves.length; i++) {
      manager.advance();
    }
    expect(manager.isComplete()).toBe(true);
  });

  it('can reset to the start', () => {
    const manager = new DrillStateManager(moves);
    manager.advance();
    manager.reset();
    expect(manager.getCurrentMoveIndex()).toBe(0);
    expect(manager.getExpectedMove()).toEqual(moves[0]);
  });
});
