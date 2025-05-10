import { PgnDataManager } from '@/utils/PgnDataManager';
import { ChessEngine }     from '@/utils/ChessEngine';
import { StatsStore }      from '@/utils/StatsStore';
import { DrillSession }    from '@/utils/DrillSession';
import { jest } from '@jest/globals';

export default function setupMocks() {
  // 1️⃣ PgnDataManager
  const mockPgnMgr = {
    loadPgn: jest.fn(),
    getParsedPgn: jest.fn().mockReturnValue(null),
    hasPgnLoaded: jest.fn().mockReturnValue(false),
    generateVariationKey: jest.fn(moves => (moves as any[]).map(m=>m.move).join('_')),
    flattenVariations: jest.fn().mockReturnValue([]),
  } as unknown as jest.Mocked<PgnDataManager>;
  (PgnDataManager as jest.MockedClass<typeof PgnDataManager>).mockImplementation(() => mockPgnMgr);

  // 2️⃣ ChessEngine
  const mockEngine = {
    reset: jest.fn(),
    makeMove: jest.fn(),
    game: { turn: jest.fn(), fen: jest.fn() },
    getHistory: jest.fn().mockReturnValue([]),
    loadPgn: jest.fn(),
  } as unknown as jest.Mocked<ChessEngine>;
  (ChessEngine as any).mockImplementation(() => mockEngine);

  // 3️⃣ StatsStore
  const mockStats = {
    recordResult: jest.fn(),
    getStats: jest.fn().mockReturnValue({ attempts: 0, successes: 0 }),
  } as unknown as jest.Mocked<StatsStore>;
  (StatsStore as any).mockImplementation(() => mockStats);

  // 4️⃣ DrillSession
  const mockDrill = {
    getCurrentFen: jest.fn(),
    getExpectedMove: jest.fn(),
    isUserTurn: jest.fn(),
    handleUserMove: jest.fn(),
    isDrillComplete: jest.fn(),
    getVariation: jest.fn(),
    getUserColor: jest.fn(),
  } as unknown as jest.Mocked<DrillSession>;
  (DrillSession as any).mockImplementation(() => mockDrill);

  return { mockPgnMgr, mockEngine, mockStats, mockDrill };
}