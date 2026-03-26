import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLAYING, RESOLVED, WAITING, ROCK, PAPER, SCISSORS, PVP, COMPUTER, BOT_PLAYER_ID } from '@rps/shared';
import type { Move } from '@rps/shared';
import type { Match } from '../src/models/Match.interface';

vi.mock('../src/config', () => ({
  config: {
    timer: { moveTimeoutMs: 10_000, reconnectTimeoutMs: 30_000 },
    corsOrigin: '*',
  },
}));

const p1 = { id: 'p1', name: 'Alice', socketId: 's1' };

function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    mode: PVP,
    bestOf: 3,
    moveTimeoutMs: 5000,
    players: [p1, null],
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

function createMockMatchService(match?: Match) {
  return {
    get: vi.fn(async () => match ? structuredClone(match) : undefined),
    getAll: vi.fn(async () => match ? [structuredClone(match)] : []),
    create: vi.fn(),
    join: vi.fn(async (_matchId: string) => {
      return createTestMatch({ state: PLAYING, players: [p1, { id: BOT_PLAYER_ID, name: 'Computer', socketId: '' }], mode: COMPUTER });
    }),
    leave: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
  };
}

function createMockGameService() {
  let storedMove: Move | null = null;

  return {
    startRound: vi.fn(),
    submitMove: vi.fn(async (_matchId: string, _playerId: string, move: Move) => {
      storedMove = move;
      return {
        match: createTestMatch({
          state: PLAYING,
          mode: COMPUTER,
          players: [p1, { id: BOT_PLAYER_ID, name: 'Computer', socketId: '' }],
          moves: [null, move],
        }),
        resolved: false,
      };
    }),
    requestRematch: vi.fn(async () => ({
      match: createTestMatch({
        state: PLAYING,
        mode: COMPUTER,
        players: [p1, { id: BOT_PLAYER_ID, name: 'Computer', socketId: '' }],
        rematchRequested: [true, true],
      }),
      ready: true,
    })),
    forfeit: vi.fn(),
    clearMoveTimer: vi.fn(),
    getStoredMove: () => storedMove,
  };
}

async function loadBotService() {
  const mod = await import('../src/services/BotService/BotService');
  return mod.BotService;
}

describe('BotService', () => {
  let BotService: Awaited<ReturnType<typeof loadBotService>>;

  beforeEach(async () => {
    BotService = await loadBotService();
  });

  describe('afterMatchCreated', () => {
    it('returns null for PVP matches', async () => {
      const match = createTestMatch({ mode: PVP });
      const matchService = createMockMatchService();
      const gameService = createMockGameService();
      const svc = new BotService(matchService as never, gameService as never);

      const result = await svc.afterMatchCreated(match);

      expect(result).toBeNull();
      expect(matchService.join).not.toHaveBeenCalled();
      expect(gameService.submitMove).not.toHaveBeenCalled();
    });

    it('joins bot and pre-submits move for COMPUTER matches', async () => {
      const match = createTestMatch({ mode: COMPUTER });
      const matchService = createMockMatchService();
      const gameService = createMockGameService();
      const svc = new BotService(matchService as never, gameService as never);

      const result = await svc.afterMatchCreated(match);

      expect(result).not.toBeNull();
      expect(matchService.join).toHaveBeenCalledWith('match-1', {
        id: BOT_PLAYER_ID,
        name: 'Computer',
        socketId: '',
      });
      expect(gameService.submitMove).toHaveBeenCalledWith(
        'match-1',
        BOT_PLAYER_ID,
        expect.stringMatching(/^(rock|paper|scissors)$/),
      );
    });

    it('submits a valid move (rock, paper, or scissors)', async () => {
      const match = createTestMatch({ mode: COMPUTER });
      const matchService = createMockMatchService();
      const gameService = createMockGameService();
      const svc = new BotService(matchService as never, gameService as never);

      await svc.afterMatchCreated(match);

      const move = gameService.getStoredMove();
      expect([ROCK, PAPER, SCISSORS]).toContain(move);
    });
  });

  describe('afterRematchRequested', () => {
    it('returns null for PVP matches', async () => {
      const match = createTestMatch({ mode: PVP, state: RESOLVED });
      const matchService = createMockMatchService(match);
      const gameService = createMockGameService();
      const svc = new BotService(matchService as never, gameService as never);

      const result = await svc.afterRematchRequested('match-1');

      expect(result).toBeNull();
      expect(gameService.requestRematch).not.toHaveBeenCalled();
    });

    it('returns null for missing match', async () => {
      const matchService = createMockMatchService();
      const gameService = createMockGameService();
      const svc = new BotService(matchService as never, gameService as never);

      const result = await svc.afterRematchRequested('nonexistent');

      expect(result).toBeNull();
    });

    it('auto-rematches and pre-submits bot move when ready', async () => {
      const match = createTestMatch({
        mode: COMPUTER,
        state: RESOLVED,
        players: [p1, { id: BOT_PLAYER_ID, name: 'Computer', socketId: '' }],
        rematchRequested: [true, false],
      });
      const matchService = createMockMatchService(match);
      const gameService = createMockGameService();
      const svc = new BotService(matchService as never, gameService as never);

      const result = await svc.afterRematchRequested('match-1');

      expect(result).not.toBeNull();
      expect(result!.ready).toBe(true);
      expect(gameService.requestRematch).toHaveBeenCalledWith('match-1', BOT_PLAYER_ID);
      expect(gameService.submitMove).toHaveBeenCalledWith(
        'match-1',
        BOT_PLAYER_ID,
        expect.stringMatching(/^(rock|paper|scissors)$/),
      );
    });

    it('does not submit move when rematch not ready', async () => {
      const match = createTestMatch({
        mode: COMPUTER,
        state: RESOLVED,
        players: [p1, { id: BOT_PLAYER_ID, name: 'Computer', socketId: '' }],
      });
      const matchService = createMockMatchService(match);
      const gameService = createMockGameService();
      gameService.requestRematch = vi.fn(async () => ({
        match: structuredClone(match),
        ready: false,
      }));
      const svc = new BotService(matchService as never, gameService as never);

      const result = await svc.afterRematchRequested('match-1');

      expect(result).not.toBeNull();
      expect(result!.ready).toBe(false);
      expect(gameService.submitMove).not.toHaveBeenCalled();
    });
  });
});
