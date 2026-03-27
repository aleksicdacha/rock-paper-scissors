import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WAITING, PLAYING, ENDED, PVP } from '@rps/shared';
import type { Match } from '../src/models/Match.interface';
import type { MatchStore } from '../src/store/MatchStore.interface';

vi.mock('../src/config', () => ({
  config: {
    timer: { moveTimeoutMs: 10_000, reconnectTimeoutMs: 30_000 },
    corsOrigin: '*',
  },
}));

const p1 = { id: 'p1', name: 'Alice', socketId: 's1' };
const p2 = { id: 'p2', name: 'Bob', socketId: 's2' };

function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    mode: PVP,
    players: [p1, p2],
    state: PLAYING,
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

function createMockStore(matches: Match[] = []): MatchStore {
  const data = new Map<string, Match>();
  for (const m of matches) data.set(m.id, structuredClone(m));

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

function createMockGameService() {
  return {
    startRound: vi.fn(async (matchId: string) => {
      return createTestMatch({ id: matchId, state: PLAYING });
    }),
    forfeit: vi.fn(async (matchId: string, loserId: string) => {
      const winner = loserId === 'p1' ? 'p2' : 'p1';
      return createTestMatch({ id: matchId, state: ENDED, winner });
    }),
    submitMove: vi.fn(),
    requestRematch: vi.fn(),
    clearMoveTimer: vi.fn(),
  };
}

async function loadMatchService() {
  const mod = await import('../src/services/MatchService/MatchService');
  return mod.MatchService;
}

describe('MatchService', () => {
  let MatchService: Awaited<ReturnType<typeof loadMatchService>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    MatchService = await loadMatchService();
  });

  describe('create', () => {
    it('creates a match in WAITING state', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      const match = await svc.create(p1);

      expect(match.state).toBe(WAITING);
      expect(match.players[0]).toEqual(p1);
      expect(match.players[1]).toBeNull();
      expect(match.id).toBeTypeOf('string');
      expect(store.set).toHaveBeenCalledOnce();
    });
  });

  describe('join', () => {
    it('adds player 2 and delegates to gameService.startRound', async () => {
      const match = createTestMatch({ state: WAITING, players: [p1, null] });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      const result = await svc.join('match-1', p2);

      expect(store.set).toHaveBeenCalledWith('match-1', expect.objectContaining({ players: [p1, p2] }));
      expect(gameService.startRound).toHaveBeenCalledWith('match-1');
      expect(result.state).toBe(PLAYING);
    });

    it('throws if match is not in WAITING state', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      await expect(svc.join('match-1', p2)).rejects.toThrow('Match is not waiting for players');
    });

    it('throws if player tries to join their own match', async () => {
      const match = createTestMatch({ state: WAITING, players: [p1, null] });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      await expect(svc.join('match-1', p1)).rejects.toThrow('Cannot join your own match');
    });

    it('throws if match not found', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      await expect(svc.join('nonexistent', p2)).rejects.toThrow('Match not found');
    });
  });

  describe('leave', () => {
    it('deletes match and returns ENDED when in WAITING state', async () => {
      const match = createTestMatch({ state: WAITING, players: [p1, null] });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.leave('match-1', 'p1');

      expect(result.state).toBe(ENDED);
      expect(store.delete).toHaveBeenCalledWith('match-1');
    });

    it('delegates to gameService.forfeit when match is active', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      const result = await svc.leave('match-1', 'p1');

      expect(gameService.forfeit).toHaveBeenCalledWith('match-1', 'p1');
      expect(result.state).toBe(ENDED);
      expect(result.winner).toBe('p2');
    });
  });

  describe('disconnect', () => {
    it('sets disconnectedPlayer and starts timer for WAITING match', async () => {
      const match = createTestMatch({ state: WAITING, players: [p1, null] });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.disconnect('match-1', 'p1');

      expect(result).not.toBeNull();
      expect(result!.disconnectedPlayer).toBe('p1');
      expect(store.set).toHaveBeenCalledWith('match-1', expect.objectContaining({ disconnectedPlayer: 'p1' }));
    });

    it('marks disconnectedPlayer and starts timer for active match', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.disconnect('match-1', 'p1');

      expect(result).not.toBeNull();
      expect(result!.disconnectedPlayer).toBe('p1');
      expect(store.set).toHaveBeenCalledWith('match-1', expect.objectContaining({ disconnectedPlayer: 'p1' }));
    });

    it('returns null if match not found', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.disconnect('nonexistent', 'p1');

      expect(result).toBeNull();
    });
  });

  describe('reconnect', () => {
    it('restores player socket and clears disconnectedPlayer', async () => {
      const match = createTestMatch({ disconnectedPlayer: 'p1' });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.reconnect('match-1', 'p1', 'new-socket');

      expect(result.disconnectedPlayer).toBeNull();
      expect(result.players[0].socketId).toBe('new-socket');
    });

    it('throws if player is not the disconnected player', async () => {
      const match = createTestMatch({ disconnectedPlayer: 'p1' });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      await expect(svc.reconnect('match-1', 'p2', 'new-socket')).rejects.toThrow('Player is not disconnected');
    });

    it('throws if match not found', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      await expect(svc.reconnect('nonexistent', 'p1', 's1')).rejects.toThrow('Match not found');
    });
  });

  describe('disconnect timeout', () => {
    it('calls gameService.forfeit after timeout expires', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      await svc.disconnect('match-1', 'p1');

      vi.advanceTimersByTime(30_000);
      await vi.advanceTimersByTimeAsync(0);

      expect(gameService.forfeit).toHaveBeenCalledWith('match-1', 'p1');
    });

    it('deletes WAITING match after timeout without forfeiting', async () => {
      const match = createTestMatch({ state: WAITING, players: [p1, null] });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      await svc.disconnect('match-1', 'p1');

      vi.advanceTimersByTime(30_000);
      await vi.advanceTimersByTimeAsync(0);

      expect(gameService.forfeit).not.toHaveBeenCalled();
      expect(store.delete).toHaveBeenCalledWith('match-1');
    });

    it('does not forfeit if match already ended before timeout', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      await svc.disconnect('match-1', 'p1');

      // Simulate match ending before timeout (e.g. other player left)
      await store.set('match-1', createTestMatch({ state: ENDED }));

      vi.advanceTimersByTime(30_000);
      await vi.advanceTimersByTimeAsync(0);

      expect(gameService.forfeit).not.toHaveBeenCalled();
    });

    it('clears timer on reconnect', async () => {
      const match = createTestMatch({ state: PLAYING, disconnectedPlayer: 'p1' });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      // Start disconnect timer
      await svc.disconnect('match-1', 'p1');
      // Reconnect before timeout
      await svc.reconnect('match-1', 'p1', 'new-socket');

      vi.advanceTimersByTime(30_000);
      await vi.advanceTimersByTimeAsync(0);

      expect(gameService.forfeit).not.toHaveBeenCalled();
    });

    it('clears timer on leave', async () => {
      const match = createTestMatch({ state: PLAYING, disconnectedPlayer: 'p1' });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      await svc.disconnect('match-1', 'p1');
      await svc.leave('match-1', 'p1');

      vi.advanceTimersByTime(30_000);
      await vi.advanceTimersByTimeAsync(0);

      // forfeit called by leave, not by timeout
      expect(gameService.forfeit).toHaveBeenCalledTimes(1);
    });
  });

  describe('get / getAll', () => {
    it('returns match by id', async () => {
      const match = createTestMatch();
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.get('match-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('match-1');
    });

    it('returns undefined for missing match', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('returns all matches', async () => {
      const m1 = createTestMatch({ id: 'match-1' });
      const m2 = createTestMatch({ id: 'match-2' });
      const store = createMockStore([m1, m2]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.getAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('create — id generation', () => {
    it('creates matches with unique IDs', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      const m1 = await svc.create(p1);
      const m2 = await svc.create(p2);

      expect(m1.id).not.toBe(m2.id);
    });
  });

  describe('leave — edge cases', () => {
    it('throws if match not found', async () => {
      const store = createMockStore();
      const svc = new MatchService(store, createMockGameService() as never);

      await expect(svc.leave('nonexistent', 'p1')).rejects.toThrow('Match not found');
    });

    it('delegates to forfeit for RESOLVED state', async () => {
      const match = createTestMatch({ state: 'RESOLVED' as never });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      await svc.leave('match-1', 'p1');

      expect(gameService.forfeit).toHaveBeenCalledWith('match-1', 'p1');
    });
  });

  describe('disconnect — RESOLVED state', () => {
    it('marks disconnectedPlayer and starts timer for RESOLVED match', async () => {
      const match = createTestMatch({ state: 'RESOLVED' as never });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.disconnect('match-1', 'p1');

      expect(result).not.toBeNull();
      expect(result!.disconnectedPlayer).toBe('p1');
    });
  });

  describe('reconnect — socket id update', () => {
    it('updates player 2 socket id on reconnect', async () => {
      const match = createTestMatch({ disconnectedPlayer: 'p2' });
      const store = createMockStore([match]);
      const svc = new MatchService(store, createMockGameService() as never);

      const result = await svc.reconnect('match-1', 'p2', 'new-socket-2');

      expect(result.players[1]!.socketId).toBe('new-socket-2');
      expect(result.disconnectedPlayer).toBeNull();
    });
  });

  describe('disconnect timeout — multiple disconnects', () => {
    it('second disconnect replaces the first timer', async () => {
      const match = createTestMatch({ state: PLAYING });
      const store = createMockStore([match]);
      const gameService = createMockGameService();
      const svc = new MatchService(store, gameService as never);

      await svc.disconnect('match-1', 'p1');

      // Re-store match to simulate reconnect + second disconnect
      await store.set('match-1', createTestMatch({ state: PLAYING, disconnectedPlayer: null }));
      await svc.disconnect('match-1', 'p2');

      // Only p2's timer should fire after 30s
      vi.advanceTimersByTime(30_000);
      await vi.advanceTimersByTimeAsync(0);

      expect(gameService.forfeit).toHaveBeenCalledWith('match-1', 'p2');
      expect(gameService.forfeit).toHaveBeenCalledTimes(1);
    });
  });
});
