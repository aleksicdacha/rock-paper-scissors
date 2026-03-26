import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLAYING, RESOLVED, ENDED, WAITING, ROCK, PAPER, SCISSORS, PVP } from '@rps/shared';
import type { Move } from '@rps/shared';
import type { Match } from '../src/models/Match.interface';
import type { MatchStore } from '../src/store/MatchStore.interface';
import type { MatchCallbacks } from '../src/gateway/SocketGateway/MatchCallbacks.interface';

vi.mock('../src/config', () => ({
  config: {
    timer: { moveTimeoutMs: 10_000, reconnectTimeoutMs: 30_000 },
    corsOrigin: '*',
  },
}));

function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    mode: PVP,
    bestOf: 3,
    moveTimeoutMs: 5000,
    players: [
      { id: 'p1', name: 'Alice', socketId: 's1' },
      { id: 'p2', name: 'Bob', socketId: 's2' },
    ],
    state: WAITING,
    rounds: [],
    scores: [0, 0],
    moves: [null, null],
    timeoutAt: null,
    disconnectedPlayer: null,
    rematchRequested: [false, false],
    winner: null,
    ...overrides,
  };
}

function createMockStore(match?: Match): MatchStore {
  const data = new Map<string, Match>();
  if (match) data.set(match.id, structuredClone(match));

  return {
    get: vi.fn(async (id: string) => {
      const m = data.get(id);
      return m ? structuredClone(m) : undefined;
    }),
    set: vi.fn(async (id: string, m: Match) => {
      data.set(id, structuredClone(m));
    }),
    delete: vi.fn(async (id: string) => {
      data.delete(id);
    }),
    all: vi.fn(async () => [...data.values()]),
  };
}

function createMockCallbacks(): MatchCallbacks {
  return {
    onRoundResolved: vi.fn(),
    onForfeit: vi.fn(),
  };
}

// Dynamic import so the vi.mock for config is applied first
async function loadGameService() {
  const mod = await import('../src/services/GameService/GameService');
  return mod.GameService;
}

describe('GameService', () => {
  let GameService: Awaited<ReturnType<typeof loadGameService>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    GameService = await loadGameService();
  });

  describe('startRound', () => {
    it('transitions match to PLAYING and sets timeoutAt', async () => {
      const match = createTestMatch();
      const store = createMockStore(match);
      const callbacks = createMockCallbacks();
      const svc = new GameService(store, callbacks);

      const result = await svc.startRound('match-1');

      expect(result.state).toBe(PLAYING);
      expect(result.moves).toEqual([null, null]);
      expect(result.rematchRequested).toEqual([false, false]);
      expect(result.winner).toBeNull();
      expect(result.timeoutAt).toBeTypeOf('number');
      expect(store.set).toHaveBeenCalledWith('match-1', expect.objectContaining({ state: PLAYING }));
    });

    it('throws if match not found', async () => {
      const store = createMockStore();
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.startRound('nonexistent')).rejects.toThrow('Match not found');
    });
  });

  describe('submitMove', () => {
    it('records a single move without resolving', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated, resolved } = await svc.submitMove('match-1', 'p1', ROCK);

      expect(resolved).toBe(false);
      expect(updated.moves[0]).toBe(ROCK);
      expect(updated.moves[1]).toBeNull();
      expect(updated.state).toBe(PLAYING);
    });

    it('resolves round when both players move', async () => {
      const match = createTestMatch({ state: PLAYING, moves: [ROCK, null] });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated, resolved } = await svc.submitMove('match-1', 'p2', SCISSORS);

      expect(resolved).toBe(true);
      expect(updated.state).toBe(RESOLVED);
      expect(updated.rounds).toHaveLength(1);
      expect(updated.rounds[0].winner).toBe(0); // rock beats scissors
      expect(updated.scores[0]).toBe(1);
    });

    it('records a draw correctly', async () => {
      const match = createTestMatch({ state: PLAYING, moves: [PAPER, null] });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated, resolved } = await svc.submitMove('match-1', 'p2', PAPER);

      expect(resolved).toBe(true);
      expect(updated.rounds[0].winner).toBeNull();
      expect(updated.scores).toEqual([0, 0]);
    });

    it('throws if match is not in PLAYING state', async () => {
      const match = createTestMatch({ state: RESOLVED });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.submitMove('match-1', 'p1', ROCK)).rejects.toThrow('Match is not in playing state');
    });

    it('throws if player already submitted a move', async () => {
      const match = createTestMatch({ state: PLAYING, moves: [ROCK, null] });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.submitMove('match-1', 'p1', PAPER)).rejects.toThrow('Move already submitted');
    });

    it('throws if player is not in match', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.submitMove('match-1', 'stranger', ROCK)).rejects.toThrow('Player not in match');
    });
  });

  describe('requestRematch', () => {
    it('marks a single player as ready without starting new round', async () => {
      const match = createTestMatch({ state: RESOLVED });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated, ready } = await svc.requestRematch('match-1', 'p1');

      expect(ready).toBe(false);
      expect(updated.rematchRequested[0]).toBe(true);
      expect(updated.rematchRequested[1]).toBe(false);
      expect(updated.state).toBe(RESOLVED);
    });

    it('starts new round when both players request rematch', async () => {
      const match = createTestMatch({ state: RESOLVED, rematchRequested: [true, false] });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated, ready } = await svc.requestRematch('match-1', 'p2');

      expect(ready).toBe(true);
      expect(updated.state).toBe(PLAYING);
      expect(updated.moves).toEqual([null, null]);
      expect(updated.rematchRequested).toEqual([false, false]);
    });

    it('throws if match is not in RESOLVED state', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.requestRematch('match-1', 'p1')).rejects.toThrow('Match is not in resolved state');
    });
  });

  describe('forfeit', () => {
    it('sets match to ENDED with opponent as winner', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const result = await svc.forfeit('match-1', 'p1');

      expect(result.state).toBe(ENDED);
      expect(result.winner).toBe('p2');
      expect(result.timeoutAt).toBeNull();
    });

    it('awards player 1 when player 2 forfeits', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const result = await svc.forfeit('match-1', 'p2');

      expect(result.winner).toBe('p1');
    });
  });

  describe('move timeout', () => {
    it('resolves round and calls onRoundResolved when timer fires', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const callbacks = createMockCallbacks();
      const svc = new GameService(store, callbacks);

      await svc.startRound('match-1');
      vi.advanceTimersByTime(10_000);

      // Allow the microtask queue to flush for the async timeout handler
      await vi.advanceTimersByTimeAsync(0);

      expect(callbacks.onRoundResolved).toHaveBeenCalledWith('match-1');
      const saved = await store.get('match-1');
      expect(saved!.state).toBe(RESOLVED);
      expect(saved!.rounds).toHaveLength(1);
    });

    it('both null moves result in a draw on timeout', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const callbacks = createMockCallbacks();
      const svc = new GameService(store, callbacks);

      await svc.startRound('match-1');
      vi.advanceTimersByTime(10_000);
      await vi.advanceTimersByTimeAsync(0);

      const saved = await store.get('match-1');
      expect(saved!.rounds[0].winner).toBeNull();
      expect(saved!.rounds[0].moves).toEqual([null, null]);
    });

    it('player who moved wins on timeout', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const callbacks = createMockCallbacks();
      const svc = new GameService(store, callbacks);

      await svc.startRound('match-1');
      await svc.submitMove('match-1', 'p1', ROCK);

      vi.advanceTimersByTime(10_000);
      await vi.advanceTimersByTimeAsync(0);

      const saved = await store.get('match-1');
      expect(saved!.rounds[0].winner).toBe(0);
    });

    it('does not resolve if match state changed before timeout', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const callbacks = createMockCallbacks();
      const svc = new GameService(store, callbacks);

      await svc.startRound('match-1');

      // Forfeit before timeout fires — clears the timer
      await svc.forfeit('match-1', 'p1');

      vi.advanceTimersByTime(10_000);
      await vi.advanceTimersByTimeAsync(0);

      expect(callbacks.onRoundResolved).not.toHaveBeenCalled();
      const saved = await store.get('match-1');
      expect(saved!.state).toBe(ENDED);
    });

    it('clears move timer when both players submit moves', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore(match);
      const callbacks = createMockCallbacks();
      const svc = new GameService(store, callbacks);

      await svc.startRound('match-1');
      await svc.submitMove('match-1', 'p1', ROCK);
      await svc.submitMove('match-1', 'p2', SCISSORS);

      vi.advanceTimersByTime(10_000);
      await vi.advanceTimersByTimeAsync(0);

      // Timer should have been cleared — callback not called from timeout
      expect(callbacks.onRoundResolved).not.toHaveBeenCalled();
    });
  });

  describe('submitMove — all move combinations', () => {
    const combos: [Move, Move, number | null][] = [
      [ROCK, SCISSORS, 0],
      [SCISSORS, PAPER, 0],
      [PAPER, ROCK, 0],
      [SCISSORS, ROCK, 1],
      [PAPER, SCISSORS, 1],
      [ROCK, PAPER, 1],
      [ROCK, ROCK, null],
      [PAPER, PAPER, null],
      [SCISSORS, SCISSORS, null],
    ];

    it.each(combos)('%s vs %s → winner=%s', async (m1, m2, expectedWinner) => {
      const match = createTestMatch({ state: PLAYING, moves: [m1, null] });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated } = await svc.submitMove('match-1', 'p2', m2);

      expect(updated.rounds[0].winner).toBe(expectedWinner);
    });
  });

  describe('submitMove — scores accumulate', () => {
    it('increments winner score across rounds', async () => {
      const match = createTestMatch({
        state: PLAYING,
        moves: [ROCK, null],
        scores: [3, 2],
        rounds: [
          { moves: [ROCK, SCISSORS], winner: 0 },
          { moves: [ROCK, SCISSORS], winner: 0 },
          { moves: [ROCK, SCISSORS], winner: 0 },
          { moves: [SCISSORS, ROCK], winner: 1 },
          { moves: [SCISSORS, ROCK], winner: 1 },
        ],
      });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated } = await svc.submitMove('match-1', 'p2', SCISSORS);

      expect(updated.scores).toEqual([4, 2]);
    });

    it('does not change scores on draw', async () => {
      const match = createTestMatch({
        state: PLAYING,
        moves: [ROCK, null],
        scores: [1, 1],
        rounds: [{ moves: [ROCK, SCISSORS], winner: 0 }, { moves: [SCISSORS, ROCK], winner: 1 }],
      });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated } = await svc.submitMove('match-1', 'p2', ROCK);

      expect(updated.scores).toEqual([1, 1]);
    });
  });

  describe('submitMove — match not found', () => {
    it('throws if match does not exist', async () => {
      const store = createMockStore();
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.submitMove('nonexistent', 'p1', ROCK)).rejects.toThrow('Match not found');
    });
  });

  describe('requestRematch — edge cases', () => {
    it('throws if match not found', async () => {
      const store = createMockStore();
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.requestRematch('nonexistent', 'p1')).rejects.toThrow('Match not found');
    });

    it('throws if player is not in match', async () => {
      const match = createTestMatch({ state: RESOLVED });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.requestRematch('match-1', 'stranger')).rejects.toThrow('Player not in match');
    });

    it('new round after rematch has fresh timeoutAt', async () => {
      const match = createTestMatch({ state: RESOLVED, rematchRequested: [true, false] });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const { match: updated } = await svc.requestRematch('match-1', 'p2');

      expect(updated.timeoutAt).toBeTypeOf('number');
      expect(updated.timeoutAt).toBeGreaterThan(0);
    });
  });

  describe('forfeit — edge cases', () => {
    it('throws if match not found', async () => {
      const store = createMockStore();
      const svc = new GameService(store, createMockCallbacks());

      await expect(svc.forfeit('nonexistent', 'p1')).rejects.toThrow('Match not found');
    });

    it('clears timeoutAt on forfeit', async () => {
      const match = createTestMatch({ state: PLAYING, timeoutAt: Date.now() + 10000 });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const result = await svc.forfeit('match-1', 'p1');

      expect(result.timeoutAt).toBeNull();
    });

    it('works from RESOLVED state', async () => {
      const match = createTestMatch({ state: RESOLVED });
      const store = createMockStore(match);
      const svc = new GameService(store, createMockCallbacks());

      const result = await svc.forfeit('match-1', 'p2');

      expect(result.state).toBe(ENDED);
      expect(result.winner).toBe('p1');
    });
  });

  describe('clearMoveTimer', () => {
    it('is safe to call when no timer exists', () => {
      const store = createMockStore();
      const svc = new GameService(store, createMockCallbacks());

      expect(() => svc.clearMoveTimer('nonexistent')).not.toThrow();
    });
  });
});
