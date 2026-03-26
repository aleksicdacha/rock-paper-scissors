import { describe, it, expect } from 'vitest';
import { PLAYING, RESOLVED, ENDED, ROCK, SCISSORS, PVP } from '@rps/shared';
import type { Match } from '../src/models/Match.interface';
import { buildGameState, buildMatchResult } from '../src/game/matchMappers';

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

describe('buildGameState', () => {
  it('maps match to game state payload', () => {
    const match = createTestMatch({
      state: PLAYING,
      scores: [2, 1],
      timeoutAt: 1700000000000,
      moves: [ROCK, null],
      rounds: [
        { moves: [ROCK, SCISSORS], winner: 0 },
        { moves: [ROCK, SCISSORS], winner: 0 },
        { moves: [SCISSORS, ROCK], winner: 1 },
      ],
    });

    const gs = buildGameState(match);

    expect(gs.matchId).toBe('match-1');
    expect(gs.players).toEqual([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);
    expect(gs.state).toBe(PLAYING);
    expect(gs.round).toBe(4); // rounds.length + 1
    expect(gs.scores).toEqual([2, 1]);
    expect(gs.timeoutAt).toBe(1700000000000);
    expect(gs.moved).toEqual([true, false]);
  });

  it('strips socketId from players', () => {
    const gs = buildGameState(createTestMatch());
    expect(gs.players[0]).not.toHaveProperty('socketId');
    expect(gs.players[1]).not.toHaveProperty('socketId');
  });

  it('moved reflects null vs non-null moves', () => {
    const match = createTestMatch({ moves: [null, SCISSORS] });
    const gs = buildGameState(match);
    expect(gs.moved).toEqual([false, true]);
  });

  it('round is 1 when no rounds played', () => {
    const gs = buildGameState(createTestMatch({ rounds: [] }));
    expect(gs.round).toBe(1);
  });
});

describe('buildMatchResult', () => {
  it('maps resolved round with player 1 winning', () => {
    const match = createTestMatch({
      state: RESOLVED,
      scores: [1, 0],
      rounds: [{ moves: [ROCK, SCISSORS], winner: 0 }],
    });

    const result = buildMatchResult(match);

    expect(result.matchId).toBe('match-1');
    expect(result.round).toEqual({ moves: [ROCK, SCISSORS], winner: 0 });
    expect(result.scores).toEqual([1, 0]);
    expect(result.winner).toBe('p1');
    expect(result.finished).toBe(false);
  });

  it('maps resolved round with player 2 winning', () => {
    const match = createTestMatch({
      state: RESOLVED,
      scores: [0, 1],
      rounds: [{ moves: [SCISSORS, ROCK], winner: 1 }],
    });

    const result = buildMatchResult(match);

    expect(result.winner).toBe('p2');
  });

  it('maps draw round (winner is null)', () => {
    const match = createTestMatch({
      state: RESOLVED,
      scores: [0, 0],
      rounds: [{ moves: [ROCK, ROCK], winner: null }],
    });

    const result = buildMatchResult(match);

    expect(result.winner).toBeNull();
  });

  it('uses last round when multiple rounds exist', () => {
    const match = createTestMatch({
      state: RESOLVED,
      scores: [1, 1],
      rounds: [
        { moves: [ROCK, SCISSORS], winner: 0 },
        { moves: [SCISSORS, ROCK], winner: 1 },
      ],
    });

    const result = buildMatchResult(match);

    expect(result.round).toEqual({ moves: [SCISSORS, ROCK], winner: 1 });
    expect(result.winner).toBe('p2');
  });

  it('finished is true when state is ENDED', () => {
    const match = createTestMatch({
      state: ENDED,
      rounds: [{ moves: [ROCK, SCISSORS], winner: 0 }],
    });

    const result = buildMatchResult(match);

    expect(result.finished).toBe(true);
  });

  it('finished is false when state is RESOLVED', () => {
    const match = createTestMatch({
      state: RESOLVED,
      rounds: [{ moves: [ROCK, SCISSORS], winner: 0 }],
    });

    expect(buildMatchResult(match).finished).toBe(false);
  });
});
